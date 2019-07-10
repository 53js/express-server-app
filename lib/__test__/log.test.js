const { constructor } = require('pino/lib/proto');

const log = require('../log');

describe('log()', () => {
	it('should return the default pino logger', () => {
		const logger = log();
		expect(logger.constructor).toEqual(constructor);
	});
});

describe('log.setLogger(lg)', () => {
	it('should update the current logger', () => {
		const logger = {};
		log.setLogger(logger);
		expect(log()).toEqual(logger);
	});
});
