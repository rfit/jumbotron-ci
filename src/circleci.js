const fs = require('fs');

const environment = require('./environment');

// Commands
const commands = {
	'set-build-details': {
		requiredEnvVars: [],
		fn: setBuildDetails
	}
};

function commandHandler(command, args) {
	if (commands.hasOwnProperty(command)) {
		return environment.ensure([
			'CIRCLECI'
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

function setBuildDetails() {
	const packageJsonPath = `${process.cwd()}/package.json`;

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

	return new Promise((resolve, reject) => {
		fs.readFile(packageJsonPath, (err, data) => {
			if (err) {
				return reject(`Error reading ${packageJsonPath}`);
			}

			let jsonData = {};
			try {
				jsonData = JSON.parse(data);
			}
			catch (e) {
				return reject(`Could not parse ${packageJsonPath}`);
			}

			jsonData.jumbotron = {
				build: buildDetails
			};

			fs.writeFile(packageJsonPath, JSON.stringify(jsonData, null, 2), err => {
				if (err) {
					return reject(`Could not write ${packageJsonPath}`);
				}

				return resolve(`Build details added to ${packageJsonPath}`);
			});
		});
	});
}

module.exports = {
	// Main entry point
	commandHandler,

	commands
};