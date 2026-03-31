#!/usr/bin/env node

const { execSync } = require('node:child_process');

const [cmd, ...args] = process.argv.slice(2);
const argsStr = args.join(' ').trim();

const exec = (command, options = {}) => {
	try {
		execSync(command, { stdio: 'inherit', ...options });
	} catch (e) {
		process.exit(e.status ?? 1);
	}
};

const debug = () => exec(`nodemon --inspect-brk server.js ${argsStr} | pino-pretty -c -t`);
const dist = () => exec(`node server.js ${argsStr}`);
const start = () => exec(`nodemon server.js ${argsStr} | pino-pretty -c -t`);
const test = () => exec(`jest --coverage --watchAll ${argsStr}`, {
	env: { ...process.env, NODE_ENV: 'test' },
});

const commands = {
	debug,
	dist,
	start,
	test,
};

commands[cmd]();
