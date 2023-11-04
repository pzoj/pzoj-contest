const express = require('express');
const fs = require('fs');
const path = require('path');
const { cwd } = require('process');
const { judge } = require('./interactor.js');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const ws = require('ws');
const cookieParser = require('cookie-parser');
var showdown = require('showdown'),
	converter = new showdown.Converter();

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());

const db = new sqlite3.Database(path.join(cwd(), 'db.db'));

/* ------------------ USER MGMT ------------------ */

function getToken(username) {
	let expiration = Math.floor((new Date()).getTime() / 1000 + 60 * 60 * 24 * 7);
	expiration = expiration.toString();
	let token = {
		'username': username,
		'expiration': expiration
	};
	token = Buffer.from(JSON.stringify(token)).toString('base64url');
	let hash = crypto.createHash('sha256');
	hash.update(token);
	let sig = hash.digest('base64url');
	let hmac = crypto.createHmac('sha256', fs.readFileSync(path.join(cwd(), 'key.key')));
	hmac.update(token);
	sig = hmac.digest('base64url');
	delete hmac;
	return token + '.' + sig;
}

function verifyToken(token) {
	if (token == undefined)
		return null;
	// verify hmac
	let hmac = crypto.createHmac('sha256', fs.readFileSync(path.join(cwd(), 'key.key')));
	let sig = token.split('.');
	token = sig[0];
	sig = sig[1];
	hmac.update(token);
	if (hmac.digest('base64url') != sig) {
		delete hmac;
		return null;
	}
	delete hmac;
	token = JSON.parse(Buffer.from(token, 'base64url').toString('ascii'));
	// verify expiration
	let expiration = parseInt(token.expiration, 16);
	if (expiration < new Date().getTime() / 1000)
		return null;
	return token.username;
}

app.post('/api/login', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		// if user does not exist, send back 404
		if (row == undefined) {
			res.status(404);
			res.end();
			return;
		}
		// hash password
		bcrypt.compare(password, row.password, (err, result) => {
			if (err) {
				console.erroror(err);
				res.status(500);
				res.end();
				return;
			}
			// if password is correct, send back a token
			if (result) {
				let token = getToken(username);
				res.cookie('token', token, { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true });
				res.send(token);
			} else {
				res.status(401);
				res.end();
			}
		});
	});
});

app.post('/api/register', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		// if user already exists, send back 409
		if (row != undefined) {
			res.status(409);
			res.end();
			return;
		}
		// hash password
		bcrypt.hash(password, 10, (err, hash) => {
			if (err) {
				console.erroror(err);
				res.status(500);
				res.end();
				return;
			}
			db.serialize(() => {
				db.run('BEGIN TRANSACTION');
				db.run('INSERT INTO users(username, password) VALUES (?, ?)', [username, hash], (err) => {
					if (err) {
						console.erroror(err);
						res.status(500);
						res.end();
						db.run('ROLLBACK');
						return;
					}
					let token = getToken(username);
					res.cookie('token', token, { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true });
					res.send(token);
					db.run('COMMIT');
				});
			});
		});
	});
});

app.get('/api/user/:username', (req, res) => {
	let username = req.params.username;
	let jsonret = {};
	// user data
	db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		// if user does not exist, send back 404
		if (row == undefined) {
			res.status(404);
			res.end();
			return;
		}
		jsonret['username'] = row.username;
		// user submissions
		db.all('SELECT * FROM submissions WHERE username = ?', [username], (err, rows) => {
			if (err) {
				console.erroror(err);
				res.status(500);
				res.end();
				return;
			}
			jsonret['submissions'] = rows;
			res.send(jsonret);
		});
	});
});

/* ------------------ PROBLEMS ------------------ */

const allowedLanguages = ['cpp', 'c', 'py'];

app.get('/api/problem/:pid', (req, res) => {
	let problem_path = path.join(cwd(), '..', 'problems', req.params.pid);
	fs.readFile(path.join(problem_path, 'problem.md'), (err, data) => {
		if (err) {
			console.erroror(err);
			res.status(404);
			res.send('Problem not found');
			return;
		}
		data = fs.readFileSync(path.join(problem_path, 'problem.md'));
		data = converter.makeHtml(data.toString());
		// let in_latex = false;
		// for (let i = 0; i < data.length; i++) {
		// 	if (data[i] == '$' && (i == 0 || data[i - 1] != '\\')) {
		// 		in_latex = !in_latex;
		// 		if (in_latex) {
		// 			data = [data.slice(0, i), '<Latex>$', data.slice(i + 1)].join('');
		// 			i += 8;
		// 		} else {
		// 			data = [data.slice(0, i), '$</Latex>', data.slice(i + 1)].join('');
		// 			i += 9;
		// 		}
		// 	}
		// }
		res.send(data);
	});
});

app.get('/api/problem/:pid/meta', (req, res) => {
	let problem_path = path.join(cwd(), '..', 'problems', req.params.pid);
	fs.readFile(path.join(problem_path, 'meta.txt'), (err, data) => {
		if (err) {
			console.erroror(err);
			res.status(404);
			res.send('Problem not found');
			return;
		}
		fs.readFile(path.join(problem_path, 'judge.txt'), (err, data2) => {
			data = data.toString().split('\n');
			data2 = data2.toString().split(' ');
			res.send({
				pid: req.params.pid,
				title: data[0],
				difficulty: data[1],
				tag: data[2],
				time: data2[0],
				memory: data2[1],
			});
		});
	});
});

app.get('/api/problem/:pid/status', (req, res) => {
	if (req.cookies == undefined) {
		res.end();
		return;
	}
	let username = req.cookies['token'];
	if (username == undefined) {
		res.end();
		return;
	}
	username = verifyToken(username);
	if (username == null) {
		res.end();
		return;
	}
	db.all('SELECT * FROM submissions WHERE problemid=? AND username=? AND result="AC"', [req.params.pid, username], (err, rows) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		if (rows.length) {
			res.send("wtf");
		} else {
			res.end();
		}
	});
});

app.get('/api/problem/:pid/editorial', (req, res) => {
	let problem_path = path.join(cwd(), '..', 'problems', req.params.pid);
	fs.readFile(path.join(problem_path, 'editorial.md'), (err, data) => {
		if (err) {
			console.erroror(err);
			res.status(404);
			res.send('Editorial not found');
			return;
		}
		data = fs.readFileSync(path.join(problem_path, 'editorial.md'));
		res.send(converter.makeHtml(data.toString()));
	});
});

app.get('/api/problems', (req, res) => {
	let problems = [];
	fs.readdir(path.join(cwd(), '..', 'problems'), (err, files) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		files.forEach((file) => {
			let tmp = [
				file,
				...fs.readFileSync(path.join(cwd(), '..', 'problems', file, 'meta.txt')).toString().split('\n')
			];
			if (req.query.q && !tmp[0].includes(req.query.q) && !tmp[1].includes(req.query.q))
				return;
			problems.push({
				pid: tmp[0],
				title: tmp[1],
				difficulty: tmp[2],
				tag: tmp[3],
			});
		});
		res.send(JSON.stringify(problems));
	});
});

app.get('/api/problems/random', (req, res) => {
	fs.readdir(path.join(cwd(), '..', 'problems'), (err, files) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		let file = files[Math.floor(Math.random() * files.length)];
		res.redirect('/problems/' + file);
	});
});

/* ------------------ SUBMISSIONS ------------------ */

const wss = new ws.Server({ port: 3002 });

wss.on('connection', (ws) => {
	ws.on('message', (message) => {
		let subtime = Math.floor(Date.now() / 1000);
		let data = JSON.parse(message.toString());
		let token = data.token;
		let user = verifyToken(token);
		if (user === null) {
			ws.send('error: Invalid token');
			ws.close();
			return;
		}
		let filecontent = data.code;
		let lang = data.lang;
		let code_path = path.join(cwd(), '..', 'problems', data.pid, 'main.' + lang);
		let problem_path = path.join(cwd(), '..', 'problems', data.pid);
		if (allowedLanguages.includes(lang)) {
			filecontent.replace('\\n', '\n');
			filecontent.replace('\\t', '\t');
			filecontent.replace('\\\\', '\\');
			try {
				fs.writeFileSync(code_path, filecontent);
			} catch (err) {
				ws.send('error: Error writing to file');
				return;
			}
		} else {
			ws.send('error: Unsupported language');
			return;
		}
		judge(code_path, lang, problem_path, ws).then((res) => {
			if (res[res.length - 1].startsWith('IE'))
				return;
			db.serialize(() => {
				db.run('BEGIN IMMEDIATE TRANSACTION');
				db.run('INSERT INTO submissions (username, problemid, timestamp, time, memory, result) VALUES (?, ?, ?, ?, ?, ?)', [user, data.pid, subtime, ...res], (err) => {
					if (err) {
						console.erroror(err);
						db.run('ROLLBACK');
						return;
					}
					db.run('COMMIT');
				});
			});
		});
	});
});

/* ------------------ COURSES ------------------ */

app.get('/api/courses', (req, res) => {
	let courses = [];
	fs.readdir(path.join(cwd(), '..', 'courses'), (err, files) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		files.forEach((file) => {
			if (file == "README.md")
				return;
			let tmp = [file, ...fs.readFileSync(path.join(cwd(), '..', 'courses', file, 'meta.txt')).toString().split('\n')];
			courses.push({
				cid: tmp[0],
				title: tmp[1],
				description: tmp[2],
			});
		});
		res.send(JSON.stringify(courses));
	});
});

app.get('/api/courses/:cid/img.png', (req, res) => {
	fs.readdir(path.join(cwd(), '..', 'courses', req.params.cid), (err, files) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		if (files.includes('img.png')) {
			res.setHeader('Content-Type', 'image/png');
			res.sendFile(path.join(cwd(), '..', 'courses', req.params.cid, 'img.png'));
		} else {
			res.status(404);
			res.end();
		}
	});
});

app.get('/api/courses/:cid', (req, res) => {
	let cid = req.params.cid;
	let course = {};
	fs.readFile(path.join(cwd(), '..', 'courses', cid, 'content.md'), (err, data) => {
		if (err) {
			console.erroror(err);
			res.status(500);
			res.end();
			return;
		}
		course.content = data.toString();
		res.send(converter.makeHtml(course.content));
	});
});

/* ------------------ LISTENING ------------------ */

app.listen(3001, () => {
	console.log(`Server started on port 3001`);
});