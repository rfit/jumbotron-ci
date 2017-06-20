const utils = require('./utils');

const environment = require('./environment');

// Commands
const commands = {
	'build-and-push': {
		requiredEnvVars: [
			'CIRCLE_PROJECT_USERNAME',
			'CIRCLE_PROJECT_REPONAME'
		],
		fn: buildAndPush
	},
	deploy: {
		requiredEnvVars: [
		],
		fn: deploy
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

/// Commands

function buildAndPush() {
	const user = process.env.CIRCLE_PROJECT_USERNAME;
	const repo = process.env.$CIRCLE_PROJECT_REPONAME;
	const tag = process.env.CIRCLE_TAG ? process.env.CIRCLE_TAG : 'staging';

	return Promise.resolve()
		.then(() => {
			// Build Docker image
			const cmd = '/bin/sh';
			const args = ['-c', 'docker', 'build', '-t', `${user}/${repo}`, '.'];

			return utils.exec(cmd, args);
		})
		.then(() => {
			// Tag Docker image
			const cmd = '/bin/sh';
			const args = ['-c', 'docker', 'tag', `${user}/${repo}`, `${user}/${repo}:${tag}`];

			return utils.exec(cmd, args);
		})
		.then(() => {
			// Push Docker image
			const cmd = '/bin/sh';
			const args = ['-c', 'docker', 'push', `${user}/${repo}:${tag}`];

			return utils.exec(cmd, args);
		});
}

function deploy() {

}

module.exports = {
	// Main entry point
	commandHandler,

	commands
};
