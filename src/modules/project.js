const fs = require('fs');

const git = require('simple-git/promise')(process.cwd());

const environment = require('../environment');

// Matches <num>.<num>[-<preid>.<num>]
const versionRegex = /^([\d]+)\.([\d]+)(-(\w+)\.(\d))?$/;

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

	const parsed = {
		major: parseInt(match[1]),
		minor: parseInt(match[2])
	};

	// Has pre?
	if (match[3]) {
		parsed.pre = {
			id: match[4],
			count: parseInt(match[5])
		};
	}

	return parsed;
}

function generateNextTag(parsed) {
	if (parsed.pre) {
		return `${parsed.major}.${parsed.minor}-${parsed.pre.id}.${parsed.pre.count + 1}`;
	}

	return `${parsed.major}.${parsed.minor + 1}`;
}

async function makeRelease() {
	const gitStatus = await git.status();

	// Verify that we are on the 'master' branch
	if (gitStatus.current !== 'master') {
		// throw new Error('This must be performed on the master branch');
	}

	if (gitStatus.conflicted.length || gitStatus.created.length || gitStatus.deleted.length || gitStatus.modified.length || gitStatus.renamed.length) {
		throw new Error('You really shouldn\'t try to release when git has changed files..!');
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

	const newTag = generateNextTag(parsedTag);

	console.log(`Previous version: ${latestTag}`);
	console.log(`Next version:     ${newTag}`);

	console.log('Tagging...');

	await git.tag(['-a', '-m', `Released ${newTag}`, newTag]);

	console.log('And now you push!');
}

function setBuildDetails(packageJsonSubPath = 'package.json') {
	const packageJsonPath = `${process.cwd()}/${packageJsonSubPath}`;

	const buildDetails = {};

	if (process.env.GITHUB_RUN_NUMBER) {
		buildDetails.buildNumber = process.env.GITHUB_RUN_NUMBER;
	}

	if (process.env.GITHUB_SHA) {
		buildDetails.sha = process.env.GITHUB_SHA;
	}

	if (process.env.CIRCLE_TAG) {
		buildDetails.release = process.env.CIRCLE_TAG;
	}
	else if (process.env.GITHUB_REF_NAME) {
		buildDetails.branch = process.env.GITHUB_REF_NAME;
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
