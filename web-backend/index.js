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
			console.error(err);
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
				console.error(err);
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
	if (username != "admin") {
		res.end();
		return;
	}
	
	username = req.body.username;
	let password = req.body.password;
	db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
		if (err) {
			console.error(err);
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
				console.error(err);
				res.status(500);
				res.end();
				return;
			}
			db.serialize(() => {
				db.run('BEGIN TRANSACTION');
				db.run('INSERT INTO users(username, password) VALUES (?, ?)', [username, hash], (err) => {
					if (err) {
						console.error(err);
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
			console.error(err);
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
				console.error(err);
				res.status(500);
				res.end();
				return;
			}
			jsonret['submissions'] = rows;
			res.send(jsonret);
		});
	});
});

const allowedLanguages = ['cpp', 'c', 'py', 'java', 'asm'];

/* ------------------ CONTESTS ------------------ */

// let leaderboard = [
// 	{
// 		'username': 'kevlu8',
// 		'points': 500,
// 		'penaltytime': 1000,
// 		'problems': {
// 			'1': {score: 100, penalty: 200},
// 			'2': {score: 100, penalty: 200},
// 			'3': {score: 100, penalty: 200},
// 			'4': {score: 100, penalty: 200},
// 			'5': {score: 100, penalty: 200}
// 		}
// 	},
// 	{
// 		'username': 'test',
// 		'points': 300,
// 		'penaltytime': 10,
// 		'problems': {
// 			'1': {score: 100, penalty: 3},
// 			'2': {score: 0, penalty: 0},
// 			'3': {score: 100, penalty: 5},
// 			'4': {score: 100, penalty: 2},
// 			'5': {score: 0, penalty: 0}
// 		}
// 	}
// ];

let leaderboard = [];

app.get('/api/contest', (req, res) => {
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

	let contest_path = path.join(cwd(), '..', 'contests');
	fs.readFile(path.join(contest_path, 'contest.md'), (err, data) => {
		if (err) {
			console.error(err);
			res.status(404);
			res.send('Contest not found');
			return;
		}
		data = fs.readFileSync(path.join(contest_path, 'contest.md'));
		data = converter.makeHtml(data.toString());
		res.send(data);
	});
});

app.get('/api/contest/meta', (req, res) => {
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

	let contest_path = path.join(cwd(), '..', 'contests');
	fs.readFile(path.join(contest_path, 'meta.txt'), (err, data) => {
		if (err) {
			console.error(err);
			res.status(404);
			res.send('Contest not found');
			return;
		}
		data = data.toString().split('\n');
		res.send({
			cid: req.params.cid,
			title: data[0],
			start: data[1],
			end: data[2],
		});
	});
});

app.get('/api/contest/leaderboard', (req, res) => {
	// return the leaderboard but sorted
	leaderboard.sort((a, b) => {
		if (a.points < b.points)
			return 1;
		else if (a.points > b.points)
			return -1;
		else if (a.penaltytime < b.penaltytime)
			return -1;
		else if (a.penaltytime > b.penaltytime)
			return 1;
		else
			return 0;
	});
	res.send(leaderboard);
});

app.get('/api/problems', (req, res) => {
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

	let problems = [];
	fs.readdir(path.join('..', 'problems'), (err, files) => {
		if (err) {
			console.error(err);
			res.status(500);
			res.end();
			return;
		}
		files.forEach((file) => {
			if (file.startsWith('.')) return;
			let tmp = [
				file,
				...fs.readFileSync(path.join('..', 'problems', file, 'meta.txt')).toString().split('\n')
			];
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

app.get('/api/problem/:pid', (req, res) => {
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

	let problem_path = path.join(cwd(), '..', 'problems', req.params.pid);
	fs.readFile(path.join(problem_path, 'problem.md'), (err, data) => {
		if (err) {
			console.error(err);
			res.status(404);
			res.send('Problem not found');
			return;
		}
		data = fs.readFileSync(path.join(problem_path, 'problem.md'));
		data = converter.makeHtml(data.toString());
		res.send(data);
	});
});

app.get('/api/problem/:pid/meta', (req, res) => {
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

	let problem_path = path.join(cwd(), '..', 'problems', req.params.pid);
	fs.readFile(path.join(problem_path, 'meta.txt'), (err, data) => {
		if (err) {
			console.error(err);
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
			console.error(err);
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

app.get('/api/reset', (req, res) => {
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
	if (username != "admin") {
		res.end();
		return;
	}
	leaderboard = [];
	let problems = [];
	let conteststarttime = parseInt(fs.readFileSync(path.join('..', 'contests', 'meta.txt')).toString().split('\n')[1]);
	fs.readdirSync(path.join(cwd(), '..', 'problems')).forEach((file) => {
		if (file.startsWith('.'))
			return;
		problems.push(file);
	});
	db.serialize(() => {
		db.run('BEGIN IMMEDIATE TRANSACTION');
		db.all('SELECT * FROM users', [], (err, rows) => {
			if (err) {
				console.error(err);
				db.run('ROLLBACK');
				res.status(500);
				res.end();
				return;
			}
			rows.forEach((row) => {
				leaderboard.push({
					'username': row.username,
					'points': 0,
					'penaltytime': 0,
					'problems': {}
				});
				problems.forEach((problem) => {
					leaderboard[leaderboard.length - 1].problems[problem] = {score: 0, penalty: 0};
				});
			});
		});
		db.run('COMMIT');
	});
	db.serialize(() => {
		db.run('BEGIN IMMEDIATE TRANSACTION');
		db.all('SELECT * FROM submissions ORDER BY timestamp ASC', [], (err, rows) => {
			if (err) {
				console.error(err);
				db.run('ROLLBACK');
				res.status(500);
				res.end();
				return;
			}
			rows.forEach((row) => {
				let userindex = leaderboard.findIndex((e) => e.username == row.username);
				if (leaderboard[userindex].problems[row.problemid].score == 100) {
					return; // skip if already AC
				}
				if (row.result == 'AC') {
					leaderboard[userindex].points += 100;
					leaderboard[userindex].penaltytime += row.timestamp - conteststarttime;
					leaderboard[userindex].problems[row.problemid].score = 100;
					leaderboard[userindex].problems[row.problemid].penalty += row.timestamp - conteststarttime;
				} else if (row.result != 'CE') {
					leaderboard[userindex].problems[row.problemid].score = 0;
					leaderboard[userindex].problems[row.problemid].penalty += 30;
				}
			});
		});
		db.run('COMMIT');
	});
	res.send('ok');
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
						console.error(err);
						db.run('ROLLBACK');
						return;
					}
					db.run('COMMIT');
				});
			});
			if (leaderboard.filter((e) => e.username == user).length == 0) {
				leaderboard.push({
					'username': user,
					'points': 0,
					'penaltytime': 0,
					'problems': {}
				});
				fs.readdirSync(path.join(cwd(), '..', 'problems')).forEach((file) => {
					if (file.startsWith('.'))
						return;
					leaderboard[leaderboard.length - 1].problems[file] = {score: 0, penalty: 0};
				});
			}
			if (res[res.length - 1].startsWith('AC')) {
				// update leaderboard
				let userindex = leaderboard.findIndex((e) => e.username == user);
				if (leaderboard[userindex].problems[data.pid].score == 100)
					return;
				let starttime = parseInt(fs.readFileSync(path.join('..', 'contests', 'meta.txt')).toString().split('\n')[1]);
				leaderboard[userindex].points += 100;
				console.log(starttime);
				leaderboard[userindex].penaltytime += Math.floor(subtime / 60) - Math.floor(starttime / 60);
				leaderboard[userindex].problems[data.pid].score = 100;
				leaderboard[userindex].problems[data.pid].penalty += Math.floor(subtime / 60) - Math.floor(starttime / 60);
			} else if (!res[res.length - 1].startsWith('CE')) {
				let userindex = leaderboard.findIndex((e) => e.username == user);
				if (leaderboard[userindex].problems[data.pid].score == 100)
					return;
				leaderboard[userindex].problems[data.pid].score = 0;
				leaderboard[userindex].problems[data.pid].penalty += 30; // 30 min penalty per wrong submission
			}
		});
	});
});

/* ------------------ LISTENING ------------------ */

app.listen(3001, () => {
	console.log(`Server started on port 3001`);
});