const index = require('.');
const lib = require('./lib');

describe('index', () => {
	it('should export lib/', () => {
		expect(index).toEqual(lib);
	});
});
