const { parseCorsOriginWhitelist } = require('../../helpers');


describe('helpers.parseCorsOriginWhitelist', () => {
	it('should return "*" if no argument is passed', () => {
		expect(parseCorsOriginWhitelist()).toEqual('*');
	});

	it('should return a boolean if argument is "boolean string" like "false" or "true"', () => {
		expect(parseCorsOriginWhitelist('true')).toEqual(true);
		expect(parseCorsOriginWhitelist('false')).toEqual(false);
	});

	it('should return a string if argument is a simple string', () => {
		const res = parseCorsOriginWhitelist('https://example1.com');
		expect(res).toEqual('https://example1.com');
	});

	it('should return a [RegExp] if argument is a comma separated string which contains a regexp', () => {
		let res = parseCorsOriginWhitelist('/localhost/');
		/* eslint-disable no-useless-escape */
		expect(res).toBeInstanceOf(RegExp);
		expect(res).toEqual(/localhost/);

		res = parseCorsOriginWhitelist('/\\.example2\\.com$/');
		expect(res).toBeInstanceOf(RegExp);
		expect(res).toEqual(/\.example2\.com$/);

		res = parseCorsOriginWhitelist('/\\.example2\\.com$/,www.bar.com');
		expect(res).toBeInstanceOf(Array);
		expect(res).toHaveLength(2);
		expect(res).toEqual([/\.example2\.com$/, 'www.bar.com']);

		res = parseCorsOriginWhitelist('www.foo.com,/\\.example2\\.com$/,www.bar.com');
		expect(res).toBeInstanceOf(Array);
		expect(res).toHaveLength(3);
		expect(res).toEqual(['www.foo.com', /\.example2\.com$/, 'www.bar.com']);
		/* eslint-enable no-useless-escape */
	});

	it('should an array if argument is a comma separated string', () => {
		const res = parseCorsOriginWhitelist('https://example1.com,https://example2.com');

		expect(res).toBeInstanceOf(Array);
		expect(res).toHaveLength(2);
		expect(res).toEqual(['https://example1.com', 'https://example2.com']);
	});

	it('should trim values', () => {
		let res = parseCorsOriginWhitelist('https://example1.com, https://example2.com');
		expect(res).toEqual(['https://example1.com', 'https://example2.com']);

		res = parseCorsOriginWhitelist(' /\\.example2\\.com$/, www.bar.com');
		expect(res).toEqual([/\.example2\.com$/, 'www.bar.com']);
	});

	it('should skip the uneccessary comma', () => {
		let res = parseCorsOriginWhitelist('https://example1.com,https://example2.com,foo.com,');

		expect(res).toBeInstanceOf(Array);
		expect(res).toHaveLength(3);
		expect(res).toEqual(['https://example1.com', 'https://example2.com', 'foo.com']);

		res = parseCorsOriginWhitelist(',,,foo.com,');

		expect(res).toEqual('foo.com');
	});
});
