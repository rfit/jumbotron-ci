const childProcess = require('child_process');

const environment = require('./environment');

// Namespaces
const namespaces = {
	aws: require('./aws'),
	circleci: require('./circleci')
};

function run() {
	const [namespace, command, args] = argumentExtractor();

	if (namespaces.hasOwnProperty(namespace)) {
		return namespaces[namespace].commandHandler(command, args)
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
	console.log(`Syntax:\n\t$ aws <namespace> <command> [<args>] <target-environment>\n`);
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

// Run commands in the shell
function exec(cmd){
	const [path, ...args] = cmd.split(/\s+/g);

	return new Promise((resolve, reject) => {
		// Spawn process
		const p = childProcess.spawn(path, args, {stdio: 'inherit'});

		// Wait for exit
		p.on('exit', code => {
			if (code !== 0) {
				const err = new Error(`command "${cmd}" exited with wrong status code: ${code}`);
				err.code = code;
				err.cmd = cmd;

				return reject(err);
			}

			return resolve();
		});
	});
}
