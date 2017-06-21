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
			'DEPLOY_USER',
			'DEPLOY_HOST',
			'CIRCLE_PROJECT_USERNAME',
			'CIRCLE_PROJECT_REPONAME',
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
	const projectUser = process.env.CIRCLE_PROJECT_USERNAME;
	const projectRepo = process.env.CIRCLE_PROJECT_REPONAME;
	const projectTag = process.env.CIRCLE_TAG ? process.env.CIRCLE_TAG : 'staging';

	return Promise.resolve()
		.then(() => {
			// Build Docker image
			const args = ['build', '-t', `${projectUser}/${projectRepo}`, '.'];

			console.log('Build Docker image...');
			return utils.exec('docker', args);
		})
		.then(() => {
			// Tag Docker image
			const args = ['tag', `${projectUser}/${projectRepo}`, `${projectUser}/${projectRepo}:${projectTag}`];

			console.log('Tag Docker image...');
			return utils.exec('docker', args);
		})
		.then(() => {
			// Push Docker image
			const args = ['push', `${projectUser}/${projectRepo}:${projectTag}`];

			console.log('Push Docker image...');
			return utils.exec('docker', args);
		});
}

function deploy() {
	const projectUser = process.env.CIRCLE_PROJECT_USERNAME;
	const projectRepo = process.env.CIRCLE_PROJECT_REPONAME;
	const projectTag = process.env.CIRCLE_TAG ? process.env.CIRCLE_TAG : 'staging';

	const deployHost = process.env.DEPLOY_HOST;
	const deployUser = process.env.DEPLOY_USER;

	const dockerEnvVarsRequired = [
		'AWS__ACCESS_KEY_ID',
		'AWS__SECRET_ACCESS_KEY',
		'AWS__S3_BUCKET',
		'FIREBASE__URL',
		'FIREBASE__SECRET',
		'LOGGLY__TOKEN',
		'LOGGLY__SUBDOMAIN'
	];

	return environment.ensure(dockerEnvVarsRequired)
		.then(() => {
			// Pull image
			const args = ['-o', 'StrictHostKeyChecking=no', `${deployUser}@${deployHost}`, `docker pull ${projectUser}/${projectRepo}:${projectTag}`];

			console.log('Pulling image...');
			return utils.exec('ssh', args);
		})
		.then(() => {
			// Stopping container
			const args = ['-o', 'StrictHostKeyChecking=no', `${deployUser}@${deployHost}`, `docker stop ${projectRepo} || true`];

			console.log('Stopping container...');
			return utils.exec('ssh', args);
		})
		.then(() => {
			// Removing container
			const args = ['-o', 'StrictHostKeyChecking=no', `${deployUser}@${deployHost}`, `docker rm ${projectRepo} || true`];

			console.log('Removing container...');
			return utils.exec('ssh', args);
		})
		.then(() => {
			// Removing image
			const args = ['-o', 'StrictHostKeyChecking=no', `${deployUser}@${deployHost}`, `docker rmi ${projectUser}/${projectRepo}:current || true`];

			console.log('Removing image...');
			return utils.exec('ssh', args);
		})
		.then(() => {
			// Tagging image
			const args = ['-o', 'StrictHostKeyChecking=no', `${deployUser}@${deployHost}`, `docker tag ${projectUser}/${projectRepo}:${projectTag} ${projectUser}/${projectRepo}:current`];

			console.log('Tagging image...');
			return utils.exec('ssh', args);
		})
		.then(() => {
			// Starting container
			let dockerEnvVars = '';
			dockerEnvVarsRequired.forEach(envVar => {
				dockerEnvVars += `-e ${envVar.toLowerCase()}=${process.env[envVar]} `;
			});
			dockerEnvVars = dockerEnvVars.slice(0, -1);

			const args = ['-o', 'StrictHostKeyChecking=no', `${deployUser}@${deployHost}`, `docker run -d --name ${projectRepo} -e NODE_ENV=production ${dockerEnvVars} ${projectUser}/${projectRepo}:current`];

			console.log('Starting container...');
			return utils.exec('ssh', args);
		});
}

module.exports = {
	// Main entry point
	commandHandler,

	commands
};
