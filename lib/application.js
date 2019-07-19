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
	app.listen(port);
	log().info(`Application started. Visit: http://localhost:${port}.`);
	return app;
};

exports.start = start;

const trustProxy = (app, value = '127.0.0.1') => app.set('trust proxy', value);

exports.trustProxy = trustProxy;

function application() {
	const app = express();

	Object.assign(app, {
		start: port => application.start(app, port),
		trustProxy: value => application.trustProxy(app, value),
		useApiFinalMiddlewares: options => app.use(getApiFinalMiddlewares(options)),
		useHealthyRoute: () => app.get('/healthy', healthy),
		useInitialMiddlewares: options => app.use(getInitialMiddlewares(options)),
		useRootRoute: () => app.get('/', root),
	});

	return app;
}
