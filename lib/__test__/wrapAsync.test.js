const wrapAsync = require('../wrapAsync');

describe('wrapAsync(fn)', () => {
	it('should wrap an async middleware to catch errors and call next', async () => {
		const error = new Error('should be catched');
		const asyncMiddleware = wrapAsync(async () => { throw error; });
		const next = jest.fn();
		await asyncMiddleware(null, null, next);
		expect(next).toHaveBeenCalledWith(error);
	});
});
