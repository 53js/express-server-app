const { application, config, log } = require('..');

const itemsRouter = require('./routes/items');
const authRouter = require('./routes/auth');

const app = application()
	.useInitialMiddlewares()
	.useHealthyRoute()
	.useRootRoute();

app.use('/auth', authRouter);
app.use('/items', itemsRouter);

app
	.useApiFinalMiddlewares()
	.start((config.server && config.server.port) || 3000);

log().info('Demo server ready');
