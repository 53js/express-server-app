const express = require('express');
const Boom = require('@hapi/boom');
const cors = require('cors');
const helmet = require('helmet');
const pinoMiddleware = require('express-pino-logger');
const { ValidationError } = require('express-json-validator-middleware');

const log = require('./log');

const handle404 = (req, res, next) => next(Boom.notFound());
exports.handle404 = handle404;

const handleErrors = (err, req, res, next) => {
	const { statusCode } = err;
	const boomErr = Boom.boomify(err, { statusCode });

	res.err = boomErr;

	// Default error handler
	// http://expressjs.com/en/guide/error-handling.html#the-default-error-handler
	if (res.headersSent) {
		next(boomErr);
		return;
	}

	res.status(boomErr.output.statusCode)
		.set(boomErr.output.headers)
		.json({
			...boomErr.output.payload,
			id: req.id,
		});
};
exports.handleErrors = handleErrors;

const handleValidationErrors = (err, req, res, next) => {
	if (err instanceof ValidationError) {
		err = Boom.boomify(
			err,
			{
				message: 'Validation Error',
				statusCode: 422,
			},
		);
	}
	next(err);
};
exports.handleValidationErrors = handleValidationErrors;

const healthy = (req, res) => res.set('content-type', 'application/json').send(true);
exports.healthy = healthy;

const root = (req, res) => res.set('content-type', 'text/plain').send('Hello!');
exports.root = root;

const getInitialMiddlewares = ({
	cors: corsMiddleware = cors(),
	helmet: helmetMiddleware = helmet(),
	json = express.json(),
	logger = pinoMiddleware({ logger: log() }),
	urlencoded = express.urlencoded({ extended: true }),
} = {}) => [
	helmetMiddleware,
	corsMiddleware,
	logger,
	json,
	urlencoded,
].filter(Boolean);
exports.getInitialMiddlewares = getInitialMiddlewares;

const getApiFinalMiddlewares = ({
	errors = handleErrors,
	notFound = handle404,
	validationErrors = handleValidationErrors,
} = {}) => [
	notFound,
	validationErrors,
	errors,
].filter(Boolean);
exports.getApiFinalMiddlewares = getApiFinalMiddlewares;