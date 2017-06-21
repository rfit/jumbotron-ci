// For loading config locally for development
require('dotenv').config({path: process.cwd()});

function ensure(vars) {
	return new Promise((resolve, reject) => {
		vars.forEach(v => {
			// The env var to ensure is set in some way
			const envVarName = v.toUpperCase();

			// Override generic with 4 prefixed env var
			let pre4envVarName = process.env.TARGET_ENV ? process.env.TARGET_ENV.substr(0, 4).toUpperCase() + '_' : '';
			pre4envVarName += v.toUpperCase();

			const pre4envValue = process.env[pre4envVarName];
			if (pre4envValue) {
				process.env[envVarName] = pre4envValue;
			}

			// Override generic with 3 prefixed env var
			let pre3envVarName = process.env.TARGET_ENV ? process.env.TARGET_ENV.substr(0, 3).toUpperCase() + '_' : '';
			pre3envVarName += v.toUpperCase();

			const pre3envValue = process.env[pre3envVarName];
			if (pre3envValue) {
				process.env[envVarName] = pre3envValue;
			}

			// Check generic is set
			if (!process.env[envVarName]) {
				reject(`Missing environment variable: '${envVarName}'`);
			}
		});

		resolve();
	});
}

function hasTargetEnvironment() {
	if (process.env.TARGET_ENV) {
		return Promise.resolve();
	}

	return Promise.reject('Target environment not specified');
}

module.exports = {
	ensure,
	hasTargetEnvironment
};
