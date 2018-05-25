const fs = require('fs');

const git = require('simple-git/promise')(process.cwd());

const environment = require('../environment');

const versionRegex = /^([0-9]+)\.([0-9]+)$/;

// Commands
const commands = {
	'make-release': {
		requiredEnvVars: [],
		fn: makeRelease
	},

	'set-build-details': {
		requiredEnvVars: [],
		fn: setBuildDetails
	}
};

function _parseLatestTag(tag) {
	const match = tag.match(versionRegex);
	if (!match) {
		return null;
	}

	return {
		major: parseInt(match[1]),
		minor: parseInt(match[2])
	};
}

async function makeRelease() {
	const gitStatus = await git.status();

	// Verify that we are on the 'master' branch
	if (gitStatus.current !== 'master') {
		// throw new Error('This must be performed on the master branch');
	}

	if (!gitStatus.isClean()) {
		throw new Error('You really shouldn\t try to release when git is not clean..!');
	}

	// Fetch tags
	console.log('Fetching tags from remote (you might be prompted for password)');
	await git.fetch('--tags');

	// Check if current git-sha already has a tag
	const gitSha = (await git.revparse('HEAD')).trim();
	try {
		// This will fail if the git sha doesn't have a tag
		await git.raw(['describe', '--contains', gitSha]);

		throw new Error('Current commit already has a tag');
	}
	catch (e) {
		if (!e.message.includes('cannot describe')) {
			// Rethrow other errors
			throw e;
		}
	}

	// Get and parse latest tag
	const tags = await git.tags();
	const latestTag = tags.latest;
	if (!latestTag) {
		throw new Error('No previous tags found');
	}

	const parsedTag = _parseLatestTag(latestTag);
	if (!parsedTag) {
		throw new Error(`Could not parse latest tag: ${latestTag}`);
	}

	const newTag = `${parsedTag.major}.${parsedTag.minor + 1}`;

	console.log(`Previous version: ${latestTag}`);
	console.log(`Next version:     ${newTag}`);

	console.log('Tagging...');

	await git.tag(['-a', '-m', `Released ${newTag}`, newTag]);

	console.log('And now you push!');
}

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
		commands
	}),

	commands
};
