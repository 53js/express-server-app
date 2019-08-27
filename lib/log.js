const pino = require('pino');

let logger = pino();

// eslint-disable-next-line no-multi-assign
exports = module.exports = () => logger;

// eslint-disable-next-line no-return-assign
exports.setLogger = (lg) => (logger = lg);
