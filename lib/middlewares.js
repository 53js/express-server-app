const express = require('express');
const boom = require('@hapi/boom');
const cors = require('cors');
const helmet = require('helmet');
const pinoMiddleware = require('express-pino-logger');
const { ValidationError } = require('express-json-validator-middleware');

const log = require('./log');
const { parseCorsOriginWhitelist } = require('./helpers');

const enableCors = () => {
	const { CORS_ORIGIN_WHITELIST } = process.env;
	const origin = parseCorsOriginWhitelist(CORS_ORIGIN_WHITELIST);
	if (process.env.NODE_ENV === 'production' && CORS_ORIGIN_WHITELIST === undefined) {
		log().warn(
			'CORS_ORIGIN_WHITELIST is not configured. '
			+ 'CORS requests are allowed from all origins by default.',
		);
	}
	return cors({ origin });
};
exports.enableCors = enableCors;

const forceHttps = (port = 443) => (req, res, next) => {
	if (process.env.NODE_ENV !== 'production' || req.secure) {
		next();
		return;
	}

	const hostnamePort = port !== 443 ? `:${port}` : '';
	res.redirect(301, `https://${req.headers.host}${hostnamePort}${req.originalUrl}`);
};
exports.forceHttps = forceHttps;

const formatValidationErrors = (validationErrors) => Object.entries(validationErrors)
	.reduce((acc, [reqProp, errors]) => {
		errors.forEach((error) => {
			let fieldPath = error.dataPath;
			fieldPath += error.keyword === 'required'
				? `.${error.params.missingProperty}`
				: '';
			fieldPath = fieldPath.replace(/^\./, '');
			fieldPath = `${reqProp}.${fieldPath}`;

			if (!acc[fieldPath]) acc[fieldPath] = [];
			acc[fieldPath].push(error.keyword);
		});
		return acc;
	}, {});

const logMiddleware = ({
	ignorePaths,
	logger,
} = {}) => pinoMiddleware({
	autoLogging: {
		ignorePaths: ignorePaths || ['/healthy'],
	},
	logger: logger || log(),
	customLogLevel: (res, err) => {
		if (res.statusCode >= 400 && res.statusCode < 500) {
			return 'warn';
		}
		if (res.statusCode >= 500 || err) {
			return 'error';
		}
		return 'info';
	},
	serializers: {
		err: (err) => {
			const isErr4xx = err.raw.isBoom
				&& err.raw.output.statusCode >= 400
				&& err.raw.output.statusCode < 500;
			return {
				type: err.type,
				message: err.message,
				stack: isErr4xx ? undefined : err.stack,
				validationErrors: err.raw.validationErrors
					? formatValidationErrors(err.raw.validationErrors)
					: undefined,
			};
		},
		req: (req) => ({
			id: req.id,
			ip: req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.remoteAddress,
			headers: {
				host: req.headers.host,
				origin: req.headers.origin,
				'user-agent': req.headers['user-agent'],
			},
			method: req.method,
			url: req.url,
		}),
		res: (res) => ({
			headers: {
				'access-control-allow-credentials': res.headers['access-control-allow-credentials'],
				'access-control-allow-headers': res.headers['access-control-allow-headers'],
				'access-control-allow-methods': res.headers['access-control-allow-methods'],
				'access-control-allow-origin': res.headers['access-control-allow-origin'],
				'x-robots-tag': res.headers['x-robots-tag'],
				'content-type': res.headers['content-type'],
			},
			statusCode: res.statusCode,
		}),
	},
});
exports.logMiddleware = logMiddleware;

const handle404 = (req, res, next) => next(boom.notFound());
exports.handle404 = handle404;

const handleErrors = (err, req, res, next) => {
	const { statusCode } = err;
	const boomErr = boom.boomify(err, { statusCode });

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
		err = boom.boomify(
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
	cors: corsMiddleware = enableCors(),
	helmet: helmetMiddleware = helmet(),
	forceHttps: forceHttpsMiddleware = exports.forceHttps(),
	json = express.json(),
	logger = logMiddleware(),
	urlencoded = express.urlencoded({ extended: true }),
} = {}) => [
	helmetMiddleware,
	forceHttpsMiddleware,
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
