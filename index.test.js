const express = require('express');
const pinoLogger = require('express-pino-logger');

const {
	asyncWrapper,
	initLogger,
} = require('./');

jest.mock('express-pino-logger', () => jest.fn(() => () => {}));

describe('asyncWrapper()', () => {
	it('should wrap an async middleware to catch errors and call next', async () => {
		const error = new Error('should be catched');
		const asyncMiddleware = asyncWrapper(async () => { throw error; });
		const next = jest.fn();
		await asyncMiddleware(null, null, next);
		expect(next).toHaveBeenCalledWith(error);
	});
});

describe('initLogger()', () => {
	let app;

	beforeEach(() => {
		app = express();
	});

	it('should add pino logger to express instance', () => {
		const spy = jest.spyOn(app, 'use');
		initLogger(app);
		expect(spy).toHaveBeenCalled();
		expect(pinoLogger).toHaveBeenCalled();
		spy.mockRestore();
	});

	it('should create pino logger with options passed as parameters', () => {
		const options = {};
		initLogger(app, options);
		expect(pinoLogger).toHaveBeenCalledWith(options);
	});
});
