const { Writable } = require('node:stream');
const pino = require('pino');
const pinoHttp = require('pino-http');

const log = require('../log');

describe('log()', () => {
	it('should return a pino logger', () => {
		const logger = log();
		expect(typeof logger.info).toBe('function');
		expect(typeof logger.warn).toBe('function');
		expect(typeof logger.error).toBe('function');
	});
});

describe('log.setLogger(lg)', () => {
	it('should update the current logger', () => {
		const prevLogger = log();
		const logger = {};
		log.setLogger(logger);
		expect(log()).toEqual(logger);
		log.setLogger(prevLogger);
	});
});

describe('pino-http', () => {
	it('remove confidential informations in request headers', () => {
		const chunks = [];
		const stream = new Writable({
			write(chunk, _enc, cb) {
				chunks.push(chunk.toString());
				cb();
			},
		});

		const logger = pino(
			{ redact: { paths: ['req.headers.authorization'], censor: '***' }, sync: true },
			stream,
		);

		const httpLogger = pinoHttp({ logger });

		const req = {
			headers: {
				toto: 'tata',
				authorization: 'forbidden',
			},
		};

		const res = { on: jest.fn() };
		httpLogger(req, res);
		req.log.info('authorization headers are removed');

		const lines = chunks.join('').trim().split('\n').filter(Boolean);
		const val = JSON.parse(lines[lines.length - 1]);
		expect(val.req.headers.authorization).toBe('***');
		expect(val.req.headers.toto).toBe('tata');
	});
});
