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

function in_contest(token) {
	if (token == undefined)
		return null;
	let username = verifyToken(token);
	if (username == null)
		return null;
	let curtime = new Date().getTime() / 1000;
	let contestid = null;
	db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
		// contestend is the unix timestamp of the end of the contest (or null if not in contest)
		// if contestend is not null, the contestid is the id of the contest
		if (row.contestend == null)
			contestid = null;
		else if (row.contestend <= curtime)
			contestid = null;
		else
			contestid = row.contestid;
		// this should only run once so it's fine
	});
	return contestid;
}

let ips = {};

app.post('/api/login', (req, res) => {
	let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if (ips[ip] == undefined) {
		ips[ip] = 0;
	} else {
		ips[ip]++;
	}
	if (ips[ip] > 100) {
		res.status(429);
		res.end();
		return;
	}
	setTimeout(() => {
		ips[ip]--;
	}, 1000 * 60);
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

app.get('/api/logout', (req, res) => {
	res.clearCookie('token');
	res.redirect('/');
});

app.post('/api/register', (req, res) => {
	let username = req.body.username;
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
					res.send(token);
					db.run('COMMIT');
				});
			});
		});
	});
});

const allowedLanguages = ["cpp", "c", "py", "java"];

/* ------------------ CONTESTS ------------------ */

let problems = []; // [pid, title, difficulty, tag, [[maybe]] contestid]

function updateProblems() {
	problems = [];
	fs.readdirSync(path.join('..', 'problems')).forEach((file) => {
		if (file.startsWith('.'))
			return;
		problems.push([file, ...fs.readFileSync(path.join('..', 'problems', file, 'meta.txt')).toString().split('\n')]);
	});
}

app.get('/api/contest/:cid', (req, res) => {
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

	// check if contest exists
	let contest_path = path.join(cwd(), '..', 'contests', req.params.cid);
	if (!fs.existsSync(contest_path)) {
		res.status(404);
		res.end();
		return;
	}

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

app.get('/api/contest/:cid/meta', (req, res) => {
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

	let contest_path = path.join(cwd(), '..', 'contests', req.params.cid);
	fs.readFile(path.join(contest_path, 'meta.txt'), (err, data) => {
		if (err) {
			console.error(err);
			res.status(404);
			res.send('Contest not found');
			return;
		}
		data = data.toString().split('\n');
		starttime = parseInt(data[1]);
		endtime = parseInt(data[2]);
		res.send({
			cid: req.params.cid,
			title: data[0],
			start: data[1],
			end: data[2],
		});
	});
});

app.get('/api/contest/:cid/leaderboard', (req, res) => {
	res.send('not implemented');
});

app.get('/api/problems', (req, res) => {
	let tok = req.cookies['token'];
	let contest = in_contest(tok);
	let ret = [];
	problems.forEach((problem) => {
		if (contest) {
			if (problem.length < 5 || problem[4] != contest) return;
		}
		ret.push({
			pid: problem[0],
			title: problem[1],
			difficulty: problem[2],
			tag: problem[3]
		});
	});
	res.send(JSON.stringify(ret));
});

app.get('/api/problem/:pid', (req, res) => {
	let pid = req.params.pid;
	let obj = problems.find((e) => e[0] == pid);
	if (obj == undefined) {
		res.status(404);
		res.end();
		return;
	}

	let tok = req.cookies['token'];
	let contest = in_contest(tok);
	if (contest) {
		if (obj.length < 5 || obj[4] != contest) {
			res.status(404);
			res.end();
			return;
		}
	} else {
		// not in contest, therefore only allow problems that are not in contests
		if (obj.length >= 5 && obj[4] != "") {
			res.status(404);
			res.end();
			return;
		}
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
	let pid = req.params.pid;
	let obj = problems.find((e) => e[0] == pid);
	if (obj == undefined) {
		res.status(404);
		res.end();
		return;
	}

	let tok = req.cookies['token'];
	let contest = in_contest(tok);
	if (contest) {
		if (obj.length < 5 || obj[4] != contest) {
			res.status(404);
			res.end();
			return;
		}
	} else {
		if (obj.length >= 5 && obj[4] != "") {
			res.status(404);
			res.end();
			return;
		}
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
	// note: this function is very terrible and should be refactored
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

app.get('/api/resetleaderboard', (req, res) => {
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

	resetleaderboard();

	res.send('ok');
});

function resetleaderboard() {
	return "not implemented";
}

/* ------------------ ADMIN PANEL ------------------ */

app.get('/api/admin', (req, res) => {
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

	// send admin.htlm
	res.sendFile(path.join(cwd(), 'admin.html'));
});

app.get('/api/resetsubmissions', (req, res) => {
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

	// clear all submissions
	db.run('DELETE FROM submissions', [], (err) => {
		if (err) {
			console.error(err);
			res.status(500);
			res.end();
			return;
		}
		res.send('ok');
	});
});

app.get('/api/updateproblems', (req, res) => {
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

	updateProblems();
	res.send('ok');
});

/* ------------------ SUBMISSIONS ------------------ */

const wss = new ws.Server({ port: 3002 });

wss.on('connection', (ws) => {
	ws.on('message', async (message) => {
		let subtime = Math.floor(Date.now() / 1000);
		let data = JSON.parse(message.toString());
		let token = data.token;
		let user = verifyToken(token);
		if (user === null) {
			ws.send('errorInvalidtoken');
			ws.close();
			return;
		}
		
		let pid = data.pid;
		if (!problems.map(e => e[0]).includes(pid)) {
			ws.send('errorInvalidproblem');
			ws.close();
			return;
		}

		if (in_contest(token) == null) {
			// not in contest; check if problem is in contest
			let obj = problems.find((e) => e[0] == pid);
			if (obj.length >= 5 && obj[4] != "") {
				ws.send('errorInvalidproblem');
				ws.close();
				return;
			}
		} else {
			// in contest; check if problem is in contest
			let obj = problems.find((e) => e[0] == pid);
			if (obj.length < 5 || obj[4] != in_contest(token)) {
				ws.send('errorInvalidproblem');
				ws.close();
				return;
			}
		}

		let filecontent = data.code;
		let lang = data.lang;
		// jid should be random string of length 10
		let jid = '';
		for (let i = 0; i < 10; i++) {
			jid += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
		}

		if (lang == 'java') {
			// due to our JID system, java will throw a temper tantrum
			// we have to rename the class to Main{JID}
			filecontent = filecontent.replace(/public\s*class\s*Main\s*{/g, `public class Main${jid} {`);
			// extremely hacky
		}

		let code_path = path.join(cwd(), '..', 'problems', data.pid, 'main' + jid + '.' + lang);
		let problem_path = path.join(cwd(), '..', 'problems', data.pid);
		if (allowedLanguages.includes(lang)) {
			filecontent.replace('\\n', '\n');
			filecontent.replace('\\t', '\t');
			filecontent.replace('\\\\', '\\');
			try {
				fs.writeFileSync(code_path, filecontent);
			} catch (err) {
				ws.send('errorErrorwritingtofile');
				return;
			}
		} else {
			ws.send('errorUnsupportedlanguage');
			return;
		}

		judge(code_path, lang, problem_path, ws, jid).then((res) => {
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
			// TODO: implement leaderboard
		});
	});
});

/* ------------------ LISTENING ------------------ */

app.listen(3001, () => {
	console.log(`Server started on port 3001`);
	resetleaderboard();
	updateProblems();
	setInterval(updateProblems, 1000 * 60 * 60);
});