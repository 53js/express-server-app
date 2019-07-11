// eslint-disable-next-line import/no-extraneous-dependencies
const Boom = require('@hapi/boom');

const {
	application,
	config,
	log,
	validator,
	wrapAsync: wa,
} = require('..');

// log.level = 40;

log().info('config', config);

const app = application().useInitialMiddlewares();

app.use((req, res, next) => {
	req.log.info('before');
	next();
});

app.get('/throw', wa(async () => { throw new Error('Unexpected error'); }));
app.get('/ok', (req, res) => { res.send('ok'); });
app.get('/bad', wa(async () => { throw Boom.badRequest(); }));
app.get('/not', wa(async () => { throw Boom.notImplemented(); }));
app.get(
	'/valid',
	validator().validate({
		query: {
			type: 'object',
			additionalProperties: false,
			properties: {
				param: { type: 'string' },
			},
			required: ['param'],
		},
	}),
	(req, res) => res.send('valid'),
);

app.use((err, req, res, next) => {
	req.log.info('err');
	next(err);
});

app.useHealthyRoute()
	.useRootRoute()
	.useApiFinalMiddlewares()
	.start(config.server.port);
