const requireDir = require('require-dir');

const utils = require('./utils');

// Load modules
const modules = requireDir('./modules');

// Load any local modules
const localModulesPath = `${process.cwd()}/.jumbotron-ci-modules`;
if (utils.isDirSync(localModulesPath)) {
	const localModules = requireDir(localModulesPath);
	Object.assign(modules, localModules);
}

function run() {
	const [module, command, args] = argumentExtractor();

	if (modules.hasOwnProperty(module)) {
		return modules[module].commandHandler(command, ...args)
			.then(result => {
				console.log('\nGreat success!', result);
			})
			.catch((err) => {
				return die(`Execution of '${module} ${command} ${args}' failed:\n${err.toString()}`);
			});
	}
	else {
		return die(`Module not recognised: ${module}`);
	}
}

run();

/// Helpers

// Die and print help
function die(reason) {
	console.log(`Syntax:\n\t$ <module> <command> [<args>] <target-environment>\n`);
	console.log('Modules:');
	for (let moduleName in modules) {
		console.log(`\t${moduleName}\n\t\tCommands:`);

		Object.keys(modules[moduleName].commands).forEach(command => {
			console.log(`\t\t\t${command}`);
		});
	}

	console.log(`\nError:\n${reason}`);
	process.exit(-1);
}

function argumentExtractor() {
	// Extract command and arguments
	const [,, module, command, ...args] = process.argv;

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

	return [module, command, args];
}
