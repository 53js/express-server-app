const { Validator } = require('express-json-validator-middleware');

let validator = new Validator({ allErrors: true });

// eslint-disable-next-line no-multi-assign
exports = module.exports = () => validator;

// eslint-disable-next-line no-return-assign
exports.setValidator = vtor => (validator = vtor);
