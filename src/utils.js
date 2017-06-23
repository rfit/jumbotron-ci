const childProcess = require('child_process');
const fs = require('fs');

// Run commands in the shell
function exec(cmd, args, options){
	return new Promise((resolve, reject) => {
		//console.log('utils.exec', cmd, args);

		// Spawn process
		const p = childProcess.spawn(cmd, args, options);

		// Collect output
		let stdout = '';
		p.stdout.on('data', data => {
			console.log(data.toString());
			stdout += data;
		});

		let stderr = '';
		p.stdout.on('data', data => {
			console.log(data.toString());
			stderr += data;
		});

		// Wait for exit
		p.on('exit', code => {
			if (code !== 0) {
				const err = new Error(`command "${cmd}" exited with wrong status code: ${code}`);
				Object.assign(err, {
					code,
					cmd,
					args,
					stdout,
					stderr
				});

				return reject(err);
			}

			return resolve(stdout);
		});
	});
}

function isDirSync(path) {
	try {
		return fs.statSync(path).isDirectory();
	} catch (e) {
		if (e.code === 'ENOENT') {
			return false;
		} else {
			throw e;
		}
	}
}

module.exports = {
	exec,
	isDirSync
};
