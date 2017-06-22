// For loading config locally for development
require('dotenv').config({path: process.cwd()});

function ensure(vars) {
	return new Promise((resolve, reject) => {
		const err = ensureSync(vars);

		if (err) {
			reject(err);
		}

		resolve();
	});
}

function ensureSync(vars) {
	for (let v of vars) {
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
			return `Missing environment variable: '${envVarName}'`;
		}
	}

	// A-okay, return no nothing!
	return;
}

function hasTargetEnvironment() {
	if (process.env.TARGET_ENV) {
		return Promise.resolve();
	}

	return Promise.reject('Target environment not specified');
}

module.exports = {
	ensure,
	ensureSync,
	hasTargetEnvironment
};
