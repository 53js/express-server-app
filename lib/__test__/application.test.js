const express = require('express');

const application = require('../application');

jest.mock('../log', () => (
	jest.fn(() => ({
		info: () => {},
	}))
));

jest.mock('express', () => (
	jest.fn(() => ({
		listen: jest.fn(),
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
