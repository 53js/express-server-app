const { Validator } = require('express-json-validator-middleware');

const validator = require('../validator');

describe('validator()', () => {
	it('should return the default validator', () => {
		const vtor = validator();
		expect(vtor).toBeInstanceOf(Validator);
	});
});

describe('validator.setValidator(vtor)', () => {
	it('should update the current validator', () => {
		const vtor = {};
		validator.setValidator(vtor);
		expect(validator()).toEqual(vtor);
	});
});
