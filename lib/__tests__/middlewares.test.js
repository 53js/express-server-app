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

const mockwarn = jest.fn();
jest.mock('../log', () => jest.fn(() => ({ warn: mockwarn })));

let next;
let req;
let res;

beforeEach(() => {
	next = jest.fn();
	req = { id: 1000 };
	res = {
		json: jest.fn(() => res),
		redirect: jest.fn(() => res),
		send: jest.fn(() => res),
		set: jest.fn(() => res),
		status: jest.fn(() => res),
	};
});

describe('middlewares.forceHttps(port = 443)', () => {
	const { NODE_ENV } = process.env;

	beforeEach(() => {
		process.env.NODE_ENV = 'production';
	});

	afterEach(() => {
		process.env.NODE_ENV = NODE_ENV;
	});

	it('should call next if request is secure or NODE_ENV != production', () => {
		middlewares.forceHttps()({ secure: true }, null, next);
		expect(next).toHaveBeenCalled();

		process.env.NODE_ENV = NODE_ENV;
		middlewares.forceHttps()({ secure: false }, null, next);
		expect(next).toHaveBeenCalled();
	});

	it('should call respond with a 301 redirect if request is not secure and NODE_ENV=production', () => {
		req = {
			secure: false,
			headers: { host: 'test.com' },
			originalUrl: '/route/path',
		};

		middlewares.forceHttps()(req, res, next);
		expect(res.redirect).toHaveBeenCalledWith(301, 'https://test.com/route/path');
	});

	it('should allow to redirect to a non default https port (ie 443)', () => {
		req = {
			secure: false,
			headers: { host: 'test.com' },
			originalUrl: '/route/path',
		};
		middlewares.forceHttps(4000)(req, res, next);
		expect(res.redirect).toHaveBeenCalledWith(301, 'https://test.com:4000/route/path');
	});
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
		const spy = jest.spyOn(middlewares, 'forceHttps');
		const mds = middlewares.getInitialMiddlewares();
		expect(mds).toHaveLength(6);
		expect(cors).toHaveBeenCalled();
		expect(helmet).toHaveBeenCalled();
		expect(middlewares.forceHttps).toHaveBeenCalled();
		expect(pinoMiddleware).toHaveBeenCalled();
		expect(express.json).toHaveBeenCalled();
		expect(express.urlencoded).toHaveBeenCalled();
		spy.mockRestore();
	});

	it('should return a list middlewares in correct order', () => {
		const c = 1;
		const h = 2;
		const j = 3;
		const l = 4;
		const u = 5;
		const f = 6;
		const mds = middlewares.getInitialMiddlewares({
			cors: c,
			forceHttps: f,
			helmet: h,
			json: j,
			logger: l,
			urlencoded: u,
		});
		expect(mds).toEqual([h, f, c, l, j, u]);
	});

	it('should allow to override one particular middleware', () => {
		const c = {};
		const mds = middlewares.getInitialMiddlewares({
			cors: c,
		});
		expect(mds).toHaveLength(6);
		expect(mds[2]).toEqual(c);
	});

	it('should allow to disable one middleware', () => {
		const mds = middlewares.getInitialMiddlewares({
			cors: false,
		});
		expect(mds).toHaveLength(5);
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

describe('middlewares.enableCors()', () => {
	const { NODE_ENV, CORS_ORIGIN_WHITELIST } = process.env;

	beforeEach(() => {
		delete process.env.NODE_ENV;
		delete process.env.CORS_ORIGIN_WHITELIST;
	});

	afterEach(() => {
		process.env.NODE_ENV = NODE_ENV;
		process.env.CORS_ORIGIN_WHITELIST = CORS_ORIGIN_WHITELIST;
		cors.mockClear();
		mockwarn.mockClear();
	});

	it('should call cors without argument if env is not production & whitelist not defined', () => {
		middlewares.enableCors();
		expect(cors).toHaveBeenCalledWith({ origin: '*' });
		expect(mockwarn).not.toHaveBeenCalled();
	});

	it('should call cors with function as arg if CORS_ORIGIN_WHITELIST env if defined', () => {
		process.env.CORS_ORIGIN_WHITELIST = 'http://example1.com,http://example2.com';
		middlewares.enableCors();
		expect(cors).toHaveBeenCalled();
		expect(mockwarn).not.toHaveBeenCalled();
		expect(cors).toHaveBeenCalledWith({ origin: ['http://example1.com', 'http://example2.com'] });
	});

	it('should print a log warn in production if whitelist is undefined', () => {
		process.env.NODE_ENV = 'production';
		middlewares.enableCors();
		expect(cors).toHaveBeenCalledWith({ origin: '*' });
		expect(mockwarn).toHaveBeenCalled();
		process.env.CORS_ORIGIN_WHITELIST = undefined;
		middlewares.enableCors();
		expect(cors).toHaveBeenCalledWith({ origin: '*' });
		expect(mockwarn).toHaveBeenCalled();
	});

	it('should not print a log warn in production if whitelist is defined', () => {
		process.env.NODE_ENV = 'production';
		process.env.CORS_ORIGIN_WHITELIST = 'http://example1.com,http://example2.com';
		middlewares.enableCors();
		expect(mockwarn).not.toHaveBeenCalled();
		process.env.CORS_ORIGIN_WHITELIST = '';
		middlewares.enableCors();
		expect(mockwarn).not.toHaveBeenCalled();
		process.env.CORS_ORIGIN_WHITELIST = 'false';
		middlewares.enableCors();
		expect(mockwarn).not.toHaveBeenCalled();
	});
});
