const fs = require('fs');
const path = require('path');

const lib = require('..');

describe('index', () => {
	it('should export lib/', () => {
		const files = fs.readdirSync(path.join(__dirname, '..')).filter(file => !['__tests__', 'index.js'].includes(file));
		files.forEach((file) => {
			const name = file.replace(/\.js$/, '');
			// eslint-disable-next-line import/no-dynamic-require,global-require
			expect(lib[name]).toEqual(require(`../${file}`));
		});
	});
});
