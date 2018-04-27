// For loading config locally for development
require('dotenv').config({
	path: `${process.cwd()}/.env`
});

function getCommandHandler({commands, checkHasTargetEnvironment, ensureEnvVars}) {
	return function(command, ...args) {
		if (commands.hasOwnProperty(command)) {
			return Promise.resolve()
				.then(() => {
					if (checkHasTargetEnvironment) {
						return hasTargetEnvironment();
					}

					return Promise.resolve();
				}).then(() => {
					return ensure(ensureEnvVars);
				})
				.then(() => {
					return ensure(commands[command].requiredEnvVars);
				})
				.then(() => {
					return commands[command].fn(...args);
				});
		}
		else {
			return Promise.reject(new Error(`Command not recognised: ${command}`));
		}
	};
}

function ensure(vars) {
	return new Promise((resolve, reject) => {
		try {
			ensureSync(vars);
			resolve();
		}
		catch (e) {
			reject(e);
		}
	});
}

function ensureSync(vars) {
	if (vars === undefined) {
		return;
	}

	const missingVars = [];

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
			missingVars.push(envVarName);
		}
	}

	// Whine if any missing variables
	if (missingVars.length > 0) {
		throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
	}
}

function hasTargetEnvironment() {
	if (process.env.TARGET_ENV) {
		return Promise.resolve();
	}

	return Promise.reject(new Error('Target environment not specified'));
}

module.exports = {
	getCommandHandler,
	ensure,
	ensureSync,
	hasTargetEnvironment
};
