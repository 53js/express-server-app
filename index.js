const fs = require('fs');
const path = require('path');
const Boom = require('@hapi/boom');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const pino = require('pino');
const pinoMiddleware = require('express-pino-logger');
const { Validator, ValidationError } = require('express-json-validator-middleware');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const resolvePath = pathName => path.resolve(pathName);

const { CONFIG_DIR = 'config', NODE_ENV } = process.env;
const envPath = resolvePath('.env');
const configPath = resolvePath(`${CONFIG_DIR}/config-${NODE_ENV}.js`);
// Copied from : https://github.com/facebook/create-react-app/blob/25184c4e91ebabd16fe1cde3d8630830e4a36a01/packages/react-scripts/config/env.js

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
	`${envPath}.${NODE_ENV}.local`,
	`${envPath}.${NODE_ENV}`,
	// Don't include `.env.local` for `test` environment
	// since normally you expect tests to produce the same
	// results for everyone
	NODE_ENV !== 'test' && `${envPath}.local`,
	envPath,
].filter(Boolean);

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
/* eslint-disable global-require*/
dotenvFiles.forEach((dotenvFile) => {
	if (fs.existsSync(dotenvFile)) {
		require('dotenv-expand')(require('dotenv').config({
			path: dotenvFile,
		}));
	}
});

const config = {};
if (fs.existsSync(configPath)) {
	// eslint-disable-next-line import/no-dynamic-require
	Object.assign(config, require(configPath));
}
exports.config = config;

// See: http://expressjs.com/en/advanced/best-practice-performance.html#use-promises
const wrapAsync = fn => (...args) => fn(...args).catch(args[args.length - 1]);
exports.wrapAsync = wrapAsync;

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

const root = (req, res) => res.set('content-type', 'text/plain').send('ok');
exports.root = root;

const log = pino();
exports.log = log;

const getInitialMiddlewares = ({
	cors: corsMiddleware = cors(),
	helmet: helmetMiddleware = helmet(),
	json = express.json(),
	logger = pinoMiddleware({ logger: log }),
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

const start = (app, port = 3000) => {
	app.listen(port);
	log.info(`Application started. Visit: http://localhost:${port}.`);
	return app;
};
exports.start = start;

const validator = new Validator({ allErrors: true });
exports.validator = validator;

const application = (...args) => {
	const app = express(...args);

	Object.assign(app, {
		start: port => start(app, port),
		useApiFinalMiddlewares: options => app.use(getApiFinalMiddlewares(options)),
		useHealthyRoute: () => app.get('/healthy', healthy),
		useInitialMiddlewares: options => app.use(getInitialMiddlewares(options)),
		useRootRoute: () => app.get('/', root),
	});

	return app;
};
exports.application = application;
