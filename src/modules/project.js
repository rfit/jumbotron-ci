const fs = require('fs');

const environment = require('../environment');

// Commands
const commands = {
	'set-build-details': {
		requiredEnvVars: [],
		fn: setBuildDetails
	}
};

function setBuildDetails(packageJsonSubPath = 'package.json') {
	const packageJsonPath = `${process.cwd()}/${packageJsonSubPath}`;

	const buildDetails = {};

	if (process.env.CIRCLE_BUILD_NUM) {
		buildDetails.buildNumber = process.env.CIRCLE_BUILD_NUM;
	}

	if (process.env.CIRCLE_SHA1) {
		buildDetails.sha = process.env.CIRCLE_SHA1;
	}

	if (process.env.CIRCLE_TAG) {
		buildDetails.release = process.env.CIRCLE_TAG;
	}
	else if (process.env.CIRCLE_BRANCH) {
		buildDetails.branch = process.env.CIRCLE_BRANCH;
	}

	if (Object.keys(buildDetails).length === 0) {
		buildDetails.branch = 'local-development';
	}

	return new Promise((resolve, reject) => {
		fs.readFile(packageJsonPath, (err, data) => {
			if (err) {
				return void reject(new Error(`Error reading ${packageJsonPath}`));
			}

			let jsonData = {};
			try {
				jsonData = JSON.parse(data);
			}
			catch (e) {
				return void reject(new Error(`Could not parse ${packageJsonPath}`));
			}

			jsonData.jumbotron = {
				build: buildDetails
			};

			fs.writeFile(packageJsonPath, JSON.stringify(jsonData, null, 2), err => {
				if (err) {
					return void reject(new Error(`Could not write ${packageJsonPath}`));
				}

				resolve(`Build details added to ${packageJsonPath}`);
			});
		});
	});
}

module.exports = {
	// Main entry point
	commandHandler: environment.getCommandHandler({
		commands,
		checkHasTargetEnvironment: false,
		ensureEnvVars: [
			'CIRCLECI'
		]
	}),

	commands
};
