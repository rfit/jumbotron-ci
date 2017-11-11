const fs = require('fs');

const AWS = require('aws-sdk');

const environment = require('../environment');

// Commands
const commands = {
	'update-function-code': {
		requiredEnvVars: [
			'AWS_LAMBDA_FUNCTION_NAME',
		],
		fn: updateFunctionCode
	}
};

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

function updateFunctionCode() {
	const targetEnv = process.env.TARGET_ENV;

	const FunctionCode = fs.readFileSync(`${process.cwd()}/Function.zip`);

	const params = {
		FunctionName: `${process.env.AWS_LAMBDA_FUNCTION_NAME}-${targetEnv.toLowerCase()}`,
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
		});
	});
}


module.exports = {
	// Main entry point
	commandHandler: environment.getCommandHandler({
		commands,
		checkHasTargetEnvironment: true,
		ensureEnvVars: [
			'AWS_ACCESS_KEY_ID',
			'AWS_SECRET_ACCESS_KEY',
			'AWS_REGION',
		]
	}),

	commands
};
