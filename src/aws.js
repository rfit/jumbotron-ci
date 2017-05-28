const fs = require('fs');

const AWS = require('aws-sdk');

const environment = require('./environment');

// Commands
const commands = {
	'update-function-code': {
		requiredEnvVars: [
			'AWS_LAMBDA_FUNCTION_NAME',
		],
		fn: updateFunctionCode
	}
};

function commandHandler(command, args) {
	if (commands.hasOwnProperty(command)) {
		return environment.ensure([
			'AWS_ACCESS_KEY_ID',
			'AWS_SECRET_ACCESS_KEY',
			'AWS_REGION',
		])
			.then(() => {
				return environment.ensure(commands[command].requiredEnvVars);
			})
			.then(() => {
				return commands[command].fn(args);
			});
	}
	else {
		Promise.reject(`Command not recognised: ${command}`);
	}
}

function getLambda() {
	const lambda = new AWS.Lambda({
		apiVersion: '2015-03-31',
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
		},
		region: process.env.AWS_REGION
	});

	return lambda;
}


/// Commands

function updateFunctionCode() {

	let targetEnv = process.env.TARGET_ENV;
	targetEnv = targetEnv.charAt(0).toUpperCase() + targetEnv.slice(1).toLowerCase();

	const FunctionCode = fs.readFileSync(`${process.cwd()}/Function.zip`);

	const params = {
		FunctionName: `${process.env.AWS_LAMBDA_FUNCTION_NAME}-${targetEnv}`,
		ZipFile: FunctionCode
	};

	return new Promise((resolve, reject) => {
		const lambda = getLambda();

		lambda.updateFunctionCode(params, (err) => {
			if (err) {
				console.log(err);
				console.log(err.stack);
				return reject(err);
			}

			return resolve();
		})
	});
}


module.exports = {
	// Main entry point
	commandHandler,

	commands
};