// For loading config locally for development
require('dotenv').config({path: process.cwd()});

function ensure(vars) {
	return new Promise((resolve, reject) => {
		vars.forEach(v => {
			const enhancedEnvVarName = `${process.env.TARGET_ENV.substr(0, 3).toUpperCase()}_${v.toUpperCase()}`;
			const envVarName = v.toUpperCase();

			// Override generic with specific
			const targetEnvValue = process.env[enhancedEnvVarName];
			if (targetEnvValue) {
				process.env[envVarName] = targetEnvValue;
			}

			// Check generic is set
			if (!process.env[envVarName]) {
				reject(`Missing environment variable: '${envVarName}'`)
			}
		});

		resolve();
	});
}

module.exports = {
	ensure
};