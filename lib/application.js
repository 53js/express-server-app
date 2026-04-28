const express = require('express');

const log = require('./log');
const {
	getApiFinalMiddlewares,
	getInitialMiddlewares,
	healthy,
	root,
} = require('./middlewares');

// eslint-disable-next-line no-use-before-define, no-multi-assign
exports = module.exports = application;

const start = (app, port = 3000) => {
	const server = app.listen(port);
	if (server && typeof server.once === 'function') {
		server.once('listening', () => {
			log().info(`Application started. Visit: http://localhost:${port}.`);
		});
		server.once('error', (err) => {
			log().error({ err }, `Application failed to start on port ${port}.`);
		});
	}
	return app;
};

exports.start = start;

const trustProxy = (app, value = '127.0.0.1') => app.set('trust proxy', value);

exports.trustProxy = trustProxy;

function application() {
	const app = express();

	Object.assign(app, {
		start: (port) => application.start(app, port),
		trustProxy: (value) => application.trustProxy(app, value),
		useApiFinalMiddlewares: (options) => app.use(getApiFinalMiddlewares(options)),
		useHealthyRoute: () => app.get('/healthy', healthy),
		useInitialMiddlewares: (options) => app.use(getInitialMiddlewares(options)),
		useRootRoute: () => app.get('/', root),
	});

	return app;
}
