#!/usr/bin/env node

const { exec } = require('child_process');
const { join } = require('path');
const program = require('commander');

const pkg = require('../package');

process.on('unhandledRejection', (err) => {
	throw err;
});

const crossEnv = join(__dirname, '../node_modules/.bin/cross-env');
const jest = join(__dirname, '../node_modules/.bin/jest');
const nodemon = join(__dirname, '../node_modules/.bin/nodemon');
const pinoPretty = join(__dirname, '../node_modules/.bin/pino-pretty');

const execute = async (...args) => {
	const { stderr, stdin, stdout } = await exec(...args);
	stderr.pipe(process.stderr);
	stdout.pipe(process.stdout);
	process.stdin.pipe(stdin);
};

const start = (file) => {
	execute(`${nodemon} --inspect-brk ${file} | ${pinoPretty} -c -t`);
};

const test = async (args) => {
	execute(`${crossEnv} NODE_ENV=test ${jest} --watchAll ${args}`);
};

program.version(pkg.version);

program
	.command('start <file>')
	.action(start);

program
	.command('test')
	.action(test);

program.parse(process.argv);
