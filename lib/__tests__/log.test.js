const proto = require('pino/lib/proto');
const { streamSym } = require('pino/lib/symbols');

const log = require('../log');

describe('log()', () => {
	it('should return the default pino logger', () => {
		const logger = log();
		expect(logger.constructor).toEqual(proto().constructor);
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
	it('remove confidential informations in request headers', (done) => {
		const write = (str) => {
			const val = JSON.parse(str);
			expect(val.req.headers.authorization).toBe('***');
			expect(val.req.headers.toto).toBe('tata');
			done();
		};

		const logger = log();
		const prevStream = logger[streamSym];
		const stream = { write };
		logger[streamSym] = stream;
		// eslint-disable-next-line global-require, import/no-extraneous-dependencies
		const httpLogger = require('pino-http')({ logger, stream });

		const req = {
			headers: {
				toto: 'tata',
				authorization: 'forbidden',
			},
		};

		const res = { on: jest.fn() };
		httpLogger(req, res);
		req.log.info('authorization headers are removed');

		logger[streamSym] = prevStream;
	});
});
