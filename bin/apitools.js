#!/usr/bin/env node

const execa = require('execa');

const LOCAL_PACKAGES = '..';

const [cmd, ...args] = process.argv.slice(2);
const argsStr = args.join(' ').trim();

const exec = command => execa.commandSync(
	command,
	{ preferLocal: LOCAL_PACKAGES, shell: true, stdio: 'inherit' },
);

const debug = () => exec(`nodemon --inspect-brk ${argsStr} | pino-pretty -c -t`);
const dist = () => exec(`node ${argsStr}`);
const start = () => exec(`nodemon ${argsStr} | pino-pretty -c -t`);
const test = () => exec(`cross-env NODE_ENV=test jest --coverage --watchAll ${argsStr}`);

const commands = {
	debug,
	dist,
	start,
	test,
};

commands[cmd]();
