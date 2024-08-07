const child_proc = require('child_process');
const { cwd, chdir } = require('process');
const fs = require('fs');

function getVerdict(code) {
	switch (code) {
		case 0:
			return "AC";
		case 1:
			return "WA";
		case 2:
			return "TLE";
		case 3:
			return "MLE";
		case 4:
			return "IE";
		case 5:
			return "OLE";
		case 6:
			return "CE";
		case 7:
			return "IR";
		case 8:
			return "RTE";
		case 9:
			return "RTE%20(Segmentation%20Fault)";
		case 10:
			return "RTE%20(Floating%20Point%20Error)";
		case 11:
			return "RTE%20(Aborted)";
		case 12:
			return "RTE%20(disallowed%20system%20call)";
		case 13:
			return "RTE%20(illegal%20instruction)";
		default:
			return "RTE";
	}
}

function judge(code_file, lang, dir, ws, jid) {
	let child = child_proc.execFile('../judging-backend/judge', [lang, dir, jid]);
	let time = 0;
	let mem = 0;
	child.stdout.on('data', (chunk) => {
		let lines = chunk.split('\n');
		while (lines[lines.length-1] == "") lines.pop();
		for (let i = 0; i < lines.length; i++) {
			ws.send(`${lines[i]}`);
			time += parseInt(lines[i].split(' ')[2]);
			mem = Math.max(mem, parseInt(lines[i].split(' ')[1]));
		}
	});
	child.stderr.on('data', (chunk) => {
		ws.send(`FIN IE ${chunk}`);
	});
	return new Promise((resolve) => {
		child.on('exit', (code) => {
			// remove code file and output
			// chdir into dir
			let c = cwd();
			chdir(dir);
			try {
				fs.rmSync(code_file);
			} catch {}
			chdir(c);
			ws.send(`FIN ${getVerdict(code)} ${mem} ${time}`);
			ws.close();
			resolve([time, mem, getVerdict(code)]);
		});
	});
}

exports.judge = judge;