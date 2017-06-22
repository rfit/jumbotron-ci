const childProcess = require('child_process');
const fs = require('fs');

// Run commands in the shell
function exec(cmd, args, options){
	return new Promise((resolve, reject) => {
		const opts = Object.assign({}, {stdio: 'inherit'}, options);
		//console.log('utils.exec', cmd, args);

		// Spawn process
		const p = childProcess.spawn(cmd, args, opts);

		// Wait for exit
		p.on('exit', code => {
			if (code !== 0) {
				const err = new Error(`command "${cmd}" exited with wrong status code: ${code}`);
				err.code = code;
				err.cmd = cmd;

				return reject(err);
			}

			return resolve();
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
