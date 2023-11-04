const child_proc = require('child_process');
const { cwd, chdir } = require('process');
const fs = require('fs');

function judge(code_file, lang, dir, ws) {
	let child = child_proc.execFile('../judging-backend/judge', [lang, dir]);
	let buffer = "";
	let time = 0;
	let mem = 0;
	child.stdout.on('data', (chunk) => {
		if (buffer) {
			ws.send(buffer);
			mem = Math.max(mem, parseInt(buffer.split(' ')[1]));
			time += parseInt(buffer.split(' ')[2]);
			console.log("A " + buffer);
		}
		buffer = chunk.split('\n')[chunk.split('\n').length - 2];
	});
	child.stderr.on('data', (chunk) => {
		// todo: send to client
		console.error(chunk);
	});
	return new Promise((resolve) => {
		child.on('exit', (code) => {
			if (code >= 8) {
				// check for bitflags
				console.log(buffer);
				if (code == 24) {
					buffer = "RTE(Segmentation Fault) " + buffer.substring(4);
				} else if (code == 40) {
					buffer = "RTE(Floating Point Error) " + buffer.substring(4);
				} else if (code == 72) {
					buffer = "RTE(Aborted) " + buffer.substring(4);
				} else if (code == 136) {
					buffer = "RTE(disallowed system call) " + buffer.substring(4);
				} else {
					buffer = "RTE " + buffer.substring(4);
				}
			}
			// remove code file and output
			// chdir into dir
			let c = cwd();
			chdir(dir);
			if (lang != 'py') {
				try {
					fs.rmSync(code_file);
				} catch {}
			}
			try {
				fs.rmSync("output.txt");
			} catch {}
			try {
				fs.rmSync("a.out");
			} catch {}
			chdir(c);
			ws.send(buffer);
			buffer = buffer.split(' ');
			mem = Math.max(mem, parseInt(buffer[1]));
			time += parseInt(buffer[2]);
			ws.send(`FIN ${buffer[0]} ${mem} ${time}`);
			ws.close();
			console.log(time, mem, buffer[0]);
			resolve([time, mem, buffer[0]]);
		});
	});
}

exports.judge = judge;