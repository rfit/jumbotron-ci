const requireDir = require('require-dir');

const utils = require('./utils');

// Namespaces
const namespaces = {
	aws: require('./aws'),
	docker: require('./docker'),
	project: require('./project')
};

// Load any local modules
const extraModulesPath = `${process.cwd()}/.jumbotron-ci-modules`;
if (utils.isDirSync(extraModulesPath)) {
	const extraModules = requireDir();
	Object.assign(namespaces, extraModules);
}

function run() {
	const [namespace, command, args] = argumentExtractor();

	if (namespaces.hasOwnProperty(namespace)) {
		return namespaces[namespace].commandHandler(command, ...args)
			.then(result => {
				console.log('\nGreat success!', result);
			})
			.catch((err) => {
				return die(`Execution of '${namespace} ${command} ${args}' failed:\n${err.toString()}`);
			});
	}
	else {
		return die(`Namespace not recognised: ${namespace}`);
	}
}

run();

/// Helpers

// Die and print help
function die(reason) {
	console.log(`Syntax:\n\t$ <namespace> <command> [<args>] <target-environment>\n`);
	console.log('Namespaces:');
	for (let namespaceName in namespaces) {
		console.log(`\t${namespaceName}\n\t\tCommands:`);

		Object.keys(namespaces[namespaceName].commands).forEach(command => {
			console.log(`\t\t\t${command}`);
		});
	}

	console.log(`\nError:\n${reason}`);
	process.exit(-1);
}

function argumentExtractor() {
	// Extract command and arguments
	const [,, namespace, command, ...args] = process.argv;

	// Extract target environment and massage it
	let targetEnv = args.pop();
	if (typeof targetEnv !== 'undefined') {
		if (!(['PRODUCTION', 'STAGING', 'DEVELOPMENT'].includes(targetEnv.toUpperCase()))) {
			// Not a target environment. Lets put that thing back
			args.push(targetEnv);
		}
		else {
			// Assign target environment
			process.env.TARGET_ENV = targetEnv.toUpperCase();
			console.log('Target environment:', process.env.TARGET_ENV);
		}
	}

	// DEBUG
	console.log('Command:', command);
	console.log('arguments:', args);

	return [namespace, command, args];
}
