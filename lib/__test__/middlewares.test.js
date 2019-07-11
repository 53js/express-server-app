const Boom = require('@hapi/boom');
const express = require('express');
const { ValidationError } = require('express-json-validator-middleware');
const cors = require('cors');
const helmet = require('helmet');
const pinoMiddleware = require('express-pino-logger');

const middlewares = require('../middlewares');

jest.mock('express', () => {
	const expressMock = () => ({
		listen: jest.fn(),
	});
	expressMock.json = jest.fn(() => () => {});
	expressMock.urlencoded = jest.fn(() => () => {});

	return expressMock;
});

jest.mock('cors', () => jest.fn(() => () => {}));
jest.mock('express-pino-logger', () => jest.fn(() => () => {}));
jest.mock('helmet', () => jest.fn(() => () => {}));

let next;
let req;
let res;

beforeEach(() => {
	next = jest.fn();
	req = { id: 1000 };
	res = {
		json: jest.fn(() => res),
		send: jest.fn(() => res),
		set: jest.fn(() => res),
		status: jest.fn(() => res),
	};
});

describe('middlewares.handle404', () => {
	it('should call next with boom.notFound error', () => {
		middlewares.handle404(null, null, next);
		expect(next).toHaveBeenCalledWith(expect.any(Boom));
		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not Found' }));
	});
});

describe('middlewares.handleErrors', () => {
	it('should render an HTTP error code with boom headers an json body in case of error', () => {
		middlewares.handleErrors(new Error(), req, res, next);
		expect(next).not.toHaveBeenCalled(); // response should be ended
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.set).toHaveBeenCalled();
		expect(res.json).toHaveBeenCalled();
	});

	it('should render an HTTP error containing req.id', () => {
		middlewares.handleErrors(new Error(), req, res, next);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: req.id }));
	});

	it('should call next if headers already sents', () => {
		const resSent = { headersSent: true };
		middlewares.handleErrors(new Error(), null, resSent, next);
		expect(next).toHaveBeenCalled();
	});

	it('should override boom errorCode with error.statusCode property', () => {
		const error = new Error();
		error.statusCode = 504;
		middlewares.handleErrors(error, req, res, next);
		expect(res.status).toHaveBeenCalledWith(504);
	});
});

describe('middlewares.handleValidationErrors', () => {
	it('should boomify ValidationErrors with statusCode 422', () => {
		middlewares.handleValidationErrors(new ValidationError(), req, res, next);
		expect(next).toHaveBeenCalledWith(expect.any(Boom));
		expect(next).toHaveBeenCalledWith(expect.objectContaining({
			output: expect.objectContaining({ statusCode: 422 }),
		}));
	});

	it('should do nothing for other types of errors', () => {
		const error = new Error();
		middlewares.handleValidationErrors(error, req, res, next);
		expect(next).toHaveBeenCalledWith(error);
	});
});

describe('middlewares.healthy', () => {
	it('should render a json with value true', () => {
		middlewares.healthy(null, res, next);
		expect(res.send).toHaveBeenCalledWith(true);
		expect(res.set).toHaveBeenCalledWith('content-type', 'application/json');
	});
});

describe('middlewares.root', () => {
	it('should render a text with value "Hello!"', () => {
		middlewares.root(null, res, next);
		expect(res.send).toHaveBeenCalledWith('Hello!');
		expect(res.set).toHaveBeenCalledWith('content-type', 'text/plain');
	});
});

describe('middlewares.getInitialMiddlewares(options)', () => {
	it('should return a list of default middlewares', () => {
		const mds = middlewares.getInitialMiddlewares();
		expect(mds).toHaveLength(5);
		expect(cors).toHaveBeenCalled();
		expect(helmet).toHaveBeenCalled();
		expect(pinoMiddleware).toHaveBeenCalled();
		expect(express.json).toHaveBeenCalled();
		expect(express.urlencoded).toHaveBeenCalled();
	});

	it('should return a list middlewares in correct order', () => {
		const c = 1;
		const h = 2;
		const j = 3;
		const l = 4;
		const u = 5;
		const mds = middlewares.getInitialMiddlewares({
			cors: c,
			helmet: h,
			json: j,
			logger: l,
			urlencoded: u,
		});
		expect(mds).toEqual([h, c, l, j, u]);
	});

	it('should allow to override one particular middleware', () => {
		const c = {};
		const mds = middlewares.getInitialMiddlewares({
			cors: c,
		});
		expect(mds).toHaveLength(5);
		expect(mds[1]).toEqual(c);
	});

	it('should allow to disable one middleware', () => {
		const mds = middlewares.getInitialMiddlewares({
			cors: false,
		});
		expect(mds).toHaveLength(4);
	});
});

describe('middlewares.getApiFinalMiddlewares(options)', () => {
	it('should return a list middlewares in correct order', () => {
		const mds = middlewares.getApiFinalMiddlewares();
		expect(mds).toEqual([
			middlewares.handle404,
			middlewares.handleValidationErrors,
			middlewares.handleErrors,
		]);
	});

	it('should allow to override one particular middleware', () => {
		const notFound = {};
		const mds = middlewares.getApiFinalMiddlewares({
			notFound,
		});
		expect(mds).toHaveLength(3);
		expect(mds[0]).toEqual(notFound);
	});

	it('should allow to disable one middleware', () => {
		const mds = middlewares.getApiFinalMiddlewares({
			notFound: false,
		});
		expect(mds).toHaveLength(2);
	});
});
