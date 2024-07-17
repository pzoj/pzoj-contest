const child_proc = require('child_process');
const { cwd, chdir } = require('process');
const fs = require('fs');

// #define AC 0
// #define WA 1
// #define TLE 2
// #define MLE 3
// #define IE 4
// #define OLE 5
// #define CE 6
// #define IR 7
// #define RTE 0x08
// #define SEGV 0x10
// #define FPE 0x20
// #define ABRT 0x40
// #define DIS_SYS 0x80
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
		default:
			return "RTE";
	}
}

function judge(code_file, lang, dir, ws, jid) {
	let child = child_proc.execFile('../judging-backend/judge', [lang, dir, jid]);
	let buffer = "";
	let time = 0;
	let mem = 0;
	child.stdout.on('data', (chunk) => {
		let lines = chunk.split('\n');
		while (lines[lines.length-1] == "") lines.pop();
		if (buffer != "" && lines != "" && lines[0] != "" && lines[0] != '\n') {
			ws.send(`AC ${buffer}`);
			time += parseInt(buffer.split(' ')[1]);
			mem = Math.max(mem, parseInt(buffer.split(' ')[0]));
		}
		for (let i = 0; i < lines.length-1; i++) {
			ws.send(`AC ${lines[i]}`);
			time += parseInt(lines[i].split(' ')[1]);
			mem = Math.max(mem, parseInt(lines[i].split(' ')[0]));
		}
		buffer = lines[lines.length-1];
	});
	child.stderr.on('data', (chunk) => {
		ws.send(`FIN IE ${chunk}`);
	});
	return new Promise((resolve) => {
		child.on('exit', (code) => {
			if (code >= 8) {
				// check for bitflags
				if (code == 24) {
					buffer = "RTE_(Segmentation_Fault) " + buffer;
				} else if (code == 40) {
					buffer = "RTE_(Floating_Point_Error) " + buffer;
				} else if (code == 72) {
					buffer = "RTE_(Aborted) " + buffer;
				} else if (code == 136) {
					buffer = "RTE_(disallowed_system_call) " + buffer;
				} else {
					// wtf
				}
			} else {
				buffer = getVerdict(code) + " " + buffer;
			}
			// remove code file and output
			// chdir into dir
			let c = cwd();
			chdir(dir);
			try {
				fs.rmSync(code_file);
			} catch {}
			try {
				fs.rmSync("output" + jid + ".txt");
			} catch {}
			try {
				fs.rmSync(jid);
			} catch {}
			if (lang == "java") {
				try {
					fs.rmSync("Main" + jid + ".class");
				} catch {}
			}
			chdir(c);
			if (buffer) {
				ws.send(buffer);
				console.log(buffer);
				buffer = buffer.split(' ');
				mem = Math.max(mem, parseInt(buffer[1]));
				time += parseInt(buffer[2]);
			}
			ws.send(`FIN ${getVerdict(code)} ${mem} ${time}`);
			ws.close();
			resolve([time, mem, getVerdict(code)]);
		});
	});
}

exports.judge = judge;