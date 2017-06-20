const childProcess = require('child_process');

// Run commands in the shell
function exec(cmd, args, options){
	return new Promise((resolve, reject) => {
		const opts = Object.assign({}, {stdio: 'inherit'}, options);

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

module.exports = {
	exec
};
