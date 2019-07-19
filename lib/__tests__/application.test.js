const express = require('express');

const application = require('../application');
const middlewares = require('../middlewares');

jest.mock('../middlewares', () => ({
	getApiFinalMiddlewares: jest.fn(),
	getInitialMiddlewares: jest.fn(),
	healthy: jest.fn(),
	root: jest.fn(),
}));

jest.mock('../log', () => (
	jest.fn(() => ({
		info: () => {},
	}))
));

jest.mock('express', () => (
	jest.fn(() => ({
		get: jest.fn(),
		listen: jest.fn(),
		set: jest.fn(),
		use: jest.fn(),
	}))
));

describe('application()', () => {
	it('should return an express app augmented with new methods', () => {
		const app = application();
		expect(app).toHaveProperty('start');
		expect(app).toHaveProperty('useApiFinalMiddlewares');
		expect(app).toHaveProperty('useHealthyRoute');
		expect(app).toHaveProperty('useInitialMiddlewares');
		expect(app).toHaveProperty('useRootRoute');
	});

	it('should call express()', () => {
		application();
		expect(express).toHaveBeenCalled();
	});

	describe('ApplicationInstance.start(port)', () => {
		it('should call application.start(app, port) with this', () => {
			const spy = jest.spyOn(application, 'start');
			const app = application();
			app.start();
			expect(spy).toHaveBeenCalledWith(app, undefined);
			spy.mockRestore();
		});
	});

	describe('ApplicationInstance.trustProxy(value)', () => {
		it('should call application.trustProxy(app, value) with this', () => {
			const spy = jest.spyOn(application, 'trustProxy');
			const app = application();
			app.trustProxy();
			expect(spy).toHaveBeenCalledWith(app, undefined);
			expect(app.set).toHaveBeenCalledWith('trust proxy', '127.0.0.1');
			spy.mockRestore();
		});
	});

	describe('ApplicationInstance.useApiFinalMiddlewares(options)', () => {
		it('should call middlewares.getApiFinalMiddlewares(options) with options', () => {
			const app = application();
			const opts = {};
			app.useApiFinalMiddlewares(opts);
			expect(middlewares.getApiFinalMiddlewares).toHaveBeenCalledWith(opts);
		});
	});

	describe('ApplicationInstance.useHealthyRoute()', () => {
		it('should add the healthy handler to route /healthy', () => {
			const app = application();
			app.useHealthyRoute();
			expect(app.get).toHaveBeenCalledWith('/healthy', middlewares.healthy);
		});
	});

	describe('ApplicationInstance.useInitialMiddlewares(options)', () => {
		it('should call middlewares.getInitialMiddlewares(options) with options', () => {
			const app = application();
			const opts = {};
			app.useInitialMiddlewares(opts);
			expect(middlewares.getInitialMiddlewares).toHaveBeenCalledWith(opts);
		});
	});

	describe('ApplicationInstance.useRootRoute()', () => {
		it('should add the root handler to route /', () => {
			const app = application();
			app.useRootRoute();
			expect(app.get).toHaveBeenCalledWith('/', middlewares.root);
		});
	});
});

describe('application.start(app, port = 3000)', () => {
	it('should start the application passed as parameter and listen on port 3000', () => {
		const app = express();
		application.start(app);
		expect(app.listen).toHaveBeenCalledWith(3000);
	});

	it('should start the application on port given as parameter', () => {
		const app = express();
		application.start(app, 9000);
		expect(app.listen).toHaveBeenCalledWith(9000);
	});
});


describe('application.trustProxy(app, value = "127.0.0.1")', () => {
	it('should call express.set with "trust proxy" and default value to localhost', () => {
		let app = express();
		application.trustProxy(app);
		expect(app.set).toHaveBeenCalledWith('trust proxy', '127.0.0.1');

		app = express();
		const allow = () => {};
		application.trustProxy(app, allow);
		expect(app.set).toHaveBeenCalledWith('trust proxy', allow);
	});
});
