#!/usr/bin/env node

const fs = require('node:fs');
const { spawn, spawnSync } = require('node:child_process');

const [cmd, ...args] = process.argv.slice(2);
const writeStderr = (message) => {
	fs.writeSync(process.stderr.fd, `${message}\n`);
};

const exit = (status) => {
	process.exit(typeof status === 'number' ? status : 1);
};

const usage = () => {
	writeStderr('Usage: express-server-app <debug|dist|start|test> [args...]');
};

const exec = (command, commandArgs = [], options = {}) => {
	const child = spawnSync(command, commandArgs, { stdio: 'inherit', ...options });
	if (child.error) {
		throw child.error;
	}
	if (child.status !== 0) {
		exit(child.status);
	}
};

const execPipe = (command, commandArgs, pipeCommand, pipeArgs, options = {}) => {
	const child = spawn(command, commandArgs, {
		env: options.env,
		stdio: ['inherit', 'pipe', 'inherit'],
	});
	const pipe = spawn(pipeCommand, pipeArgs, {
		env: options.env,
		stdio: ['pipe', 'inherit', 'inherit'],
	});

	child.on('error', (error) => {
		throw error;
	});
	pipe.on('error', (error) => {
		throw error;
	});

	child.stdout.pipe(pipe.stdin);

	child.on('close', (status, signal) => {
		pipe.stdin.end();
		pipe.on('close', () => {
			if (signal) {
				process.kill(process.pid, signal);
				return;
			}
			exit(status);
		});
	});
};

const debug = () => execPipe('nodemon', ['--inspect-brk', 'server.js', ...args], 'pino-pretty', ['-c', '-t']);
const dist = () => exec(process.execPath, ['server.js', ...args]);
const start = () => execPipe('nodemon', ['server.js', ...args], 'pino-pretty', ['-c', '-t']);
const test = () => exec('jest', ['--coverage', ...args], {
	env: { ...process.env, NODE_ENV: 'test' },
});

const commands = {
	debug,
	dist,
	start,
	test,
};

if (!commands[cmd]) {
	if (cmd) {
		writeStderr(`Unknown command: ${cmd}`);
	}
	usage();
	exit(1);
}

commands[cmd]();
