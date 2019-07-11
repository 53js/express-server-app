/* eslint-disable global-require */
describe('config', () => {
	beforeEach(() => {
		jest.resetModules();
		delete process.env.HELLO;
		delete process.env.NODE_ENV;
	});

	it('should have set process.env.NODE_ENV to development if not set', () => {
		delete process.env.NODE_ENV;
		require('../config');
		expect(process.env.NODE_ENV).toEqual('development');
	});

	it('should retrieve env variables from .env files', () => {
		process.env.NODE_ENV = 'test';
		require('../config');
		expect(process.env.HELLO).toEqual('WORLD');
	});

	it('should be updated according to env variables', () => {
		process.env.NODE_ENV = 'test';
		process.env.CONFIG_DIR = 'lib/__tests__/fixtures';
		const config = require('../config');
		expect(config.hello).toEqual('WORLD');
	});
});
