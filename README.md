# server-app

A minimal opinionated set of tools to create Web and REST servers.  

# Philosophy

It does not aim to cover every needs of a Web or REST API server. It only aims to provide a stable base of development.

We do not want to recreate everything ! But to provide a set of existing libraries which are already used by many.

It mainly uses the following modules:  
- [express](https://github.com/expressjs/express)
- [pino](https://github.com/pinojs/pino)
- [dotenv](https://github.com/motdotla/dotenv)
- [@hapi/boom](https://github.com/hapijs/boom)
- [express-json-validator-middleware](https://github.com/JouzaLoL/express-json-validator-middleware) (and [ajv](https://github.com/epoberezkin/ajv))

# Features

**Config**

Reads server configuration from .env and config/config-<NODE_ENV>.js files.

**Logging**

Creates a default logger using pinojs and add it to express server.

**Basic security**

The server adds by default the cors and helmet middlewares.

**JSON Schema request validation**

Requests params can be validated using Ajv and JSON Schema.

**Async middlewares helpers**

Allows to write middlewares using async/await and promises.

**Error formatting for REST APIs**

Errors are formatted using Boom and sent back as JSON with correct errors codes.

**CLI tools to run and debug the app**

The following commands are available:   
- `debug`: run your server with node inspect to allow debugging
- `dist`: run your server for production (NODE_ENV=production is not added automatically)
- `start`: run your server for development without debugger
- `test`: test your server

# Getting started

## Installation

**Using npm**

```sh
npm install server-app
```

**Using yarn**

```sh
yarn add server-app
```

## Usage

See the example in the repo.

**The entry point of your server must be the file `server.js`**

### Create a simple server

```js
// server.js
const { application } = require('server-app');

// Initializes express application and add minimum middlewares (security, request parsing, logging)
const app = application().useInitialMiddlewares();

// Add your own routes using express api
app.get('/coucou', (req, res) => { res.send('hibou'); });

// Start the server on the default port (3000)
app.start();
```

### Create a REST API

```js
const { application } = require('server-app');

const app = application().useInitialMiddlewares();

// .. Write your own routes and middlewares ...

app.useHealthyRoute() // Add the route /healthy for health control of the server
	.useApiFinalMiddlewares() // Add middlewares for REST API
	.start();
```

### Logging

```js
// Require the default logger
const { log } = require('server-app');

// Log on info level (see pino api for details)
// Note that log() is a function!
log().info('Hello!');
```

### Config

```sh
# .env
PORT=9000
```

```js
// config/config-development.js
module.exports = {
	serverPort: process.env.PORT,
};
```

```js
// server.js
const { application, config } = require('server-app');
// ...
app.start(config.serverPort);
```

### Request validation
```js
const { application, validator } = require('server-app');

const app = application().useInitialMiddlewares();

app.get(
	'/valid',
	validator().validate({ // Note that validator() is a function!
		query: { // JSON Schema object
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

app.useApiFinalMiddlewares()
	.start();
```

### REST API errors

```js
const { application } = require('server-app');
const Boom = require('@hapi/boom'); // Require Boom ! 

const app = application().useInitialMiddlewares();

app.get(
	'/notImplemented',
	(req, res, next) => next(Boom.notImplemented()),
);

app.useApiFinalMiddlewares()
	.start();
```

### Express async handlers

```js
const { application, asyncWrapper } = require('server-app');

const Person = require('./models/Person');

const app = application().useInitialMiddlewares();

app.get(
	'/persons',
	asyncWrapper(async (req, res, next) => { await Person.findAll(); }),
);

app.useApiFinalMiddlewares()
	.start();
```

## Launch the server

**In development:**  
```sh
server-app start
```

**In production:**
```sh
NODE_ENV=production server-app dist
```

# API

## server-app

An object containing the following tools:  

```js
{
	application, // create server
	config, // get config
	log, // global logger
	middlewares, // defaults middlewares
	validator, // JSON Schema request validator
	wrapAsync, // helper for request async handlers
} = require('server-app');
```

## .application

### .application()

It returns ApplicationInstance, an express application augmented with the following methods:
- start
- useApiFinalMiddlewares
- useHealthyRoute
- useInitialMiddlewares
- useRootRoute

Example:  
```js
const { application } = require('server-app');
const app = application();
```

### .application.start(app, [port])

Start the application passed as parameter optionnaly on port \[port\].
Default port is 3000.

### ApplicationInstance.start([port])

Start the server optionnaly on port passed as parameter.

Example:  
```js
const { application } = require('server-app');
const app = application();
app.start(80);
```

### ApplicationInstance.useApiFinalMiddlewares([options])

Add middlewares for REST API application.

Those "final" middlewares must be at the end of the chain.
Call this method just before start().  
*See `.middlewares.getApiFinalMiddlewares([options])` for details.*

Example:  
```js
const { application } = require('server-app');
const app = application();
// ... add your routes
app.useApiFinalMiddlewares().start();
```

### ApplicationInstance.useHealthyRoute()

Add the route `/healthy`.  
*See `.middlewares.healthy` for details.*

Example:  
```js
const { application } = require('server-app');
const app = application();
// ... add your routes
app.useHealthyRoute()
	.useApiFinalMiddlewares() // last middlewares !
	.start();
```

### ApplicationInstance.useInitialMiddlewares([options])

Add default middlewares any server.

Those middlewares must be at the beginning of the chain.
Call this method just after create the application.  
*See `.middlewares.useInitialMiddlewares([options])` for details.*

Example:  
```js
const { application } = require('server-app');
const app = application()
	.useInitialMiddlewares(); // first middlewares !
// ... add your routes
app.useApiFinalMiddlewares() // last middlewares !
	.start();
```

### ApplicationInstance.useRootRoute()

Set a default index route `/`.  
*See `.middlewares.root` for details.*

Example:  
```js
const { application } = require('server-app');
const app = application();
// ... add your routes
app.useRootRoute()
	.start();
```

## .config

An object containing the config object defined in file `config/config-<NODE_ENV>.js`.

When you require server-app, it reads the environment variables defined in .env files using dotenv.  
Then you can use this variables using the process.env object.

The JavaScript config files directory can be changed using the environment variable `CONFIG_DIR`.

*The .env config management has been copied from create-react-app. See its documentation for details.*

Example:
```.env
# .env
CONFIG_DIR=conf
LOG_LEVEL=30
SECRET_ACCESS_KEY=abcdef1234
```

```js
// conf/config-production.js
module.exports = {
	tiersApi: {
		accessKey: process.env.accessKey,
	},
};
```

```js
// server.js
const { config, log() } = require('server-app');
log().level = process.env.LOG_LEVEL;
tiers.setAccessKey(config.accessKey);
```

## .log

### .log()

Returns the global logger. By default it returns a Pino instance.

Example:  
```js
const { log } = require('server-app');
const logger = log();
logger.info('Hello!');
```

### .log.setLogger(lg)

Override the global logger with the logger passed as parameter.  

Returns the new logger.

Example:  
```js
const { log } = require('server-app');
const logger = log.setLogger(pino());
```

## .middlewares

### .middlewares.handle404

A REST middleware that throws Boom.notFound() if route is not found.

### .middlewares.handleErrors

A REST middleware that respond with errors as JSON with correct status codes and headers using Boom.

### .middlewares.handleValidationErrors

A REST middleware that handles JSON Schema validation errors and throw a Boom error.

### .middlewares.healthy

A route that sends a minimal json (boolean true) used to monitor the server health.

### .middlewares.root

A default index route that sends a short text.

### .middlewares.getInitialMiddlewares(options)

Returns an array of middlewares that should be added at the beginning of the express middleware chain.

Middlewares (order is important):   
- helmet
- cors
- logger
- express.json
- express.urlencoded

It is possible to override default middlewares using the options parameter :

#### options

An object containing middlewares :

```js
{
	cors, // default: cors()
	helmet, // default: helmet(),
	json, // default: express.json(),
	logger, // default: pinoMiddleware({ logger: log() }),
	urlencoded, // default: express.urlencoded({ extended: true }),
}
```

Set a middleware to false to disable it.

Example:
```js
const { middlewares } = require('server-app');
const initialMiddlewares = getInitialMiddlewares({
	cors: cors({ origin: 'http://example.com' }), // override cors middleware
	helmet: false, // disable helmet
})
```

### .middlewares.getApiFinalMiddlewares(options)

Returns an array of middlewares that should be added at the end of the express middleware chain.

Middlewares (order is important):   
- notFound
- validationErrors
- errors

#### options

An object containing middlewares :

```js
{
	errors, // default: .middleware.handleErrors
	notFound, // default: .middleware.handle404
	validationErrors, // default: .middleware.handleValidationErrors
}
```

Set a middleware to false to disable it.

Example:
```js
const { middlewares } = require('server-app');
const finalMiddlewares = getFinalMiddlewares({
	notFound: (req, res, next) => next(Boom.notImplemented()),
	validationErrors: false, // disable validation error middleware
})
```

## .validator

### .validator()

Returns the global JSON Schema validator.

*See [express-json-validator-middleware](https://github.com/JouzaLoL/express-json-validator-middleware),
[ajv](https://github.com/epoberezkin/ajv),
[JSON Schema](https://json-schema.org/) for details.*

Example:  
```js
const { validator } = require('server-app');
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
```

### .validator.setValidator(vtor)

Override the global validator with the validator passed as parameter.  

Returns the new validator.

Example:  
```js
const { validator } = require('server-app');
validator.setLogger(new Validator());
```

## .wrapAsync

### .wrapAsync(fn)

Wraps the fn request handler to allow async/await and Promise handlers.

Returns the wrapped middleware.

Example:
```js
const { asyncWrapper } = require('server-app');
// ...
app.get(
	'/persons',
	asyncWrapper(async (req, res, next) => { await Person.findAll(); }),
);
```

# CLI

## debug

Run the server using nodemon with the --inspect-brk flag to allow livereload and debuggers.
It also pipes output to [pino-pretty](https://github.com/pinojs/pino-pretty) to render JSON logs more friendly.

Example (using `npx`):
```sh
npx server-app debug
```

You may also add scripts to your package.json :
x
Example:
```json
...
"scripts": {
	"debug": "server-app debug",
	"dist": "server-app dist",
	"start": "server-app start",
	"test": "server-app test", 
}
...
```

## dist

Run the server using node only. It does **not** set the env variables NODE_ENV to production so you may have to!

Example: (using package.json scripts)
```sh
NODE_ENV=production npm run dist
```

## start

Run the server using nodemon and pino-pretty.

Example: (using package.json scripts)
```sh
npm start
```

## test

Test the server using jest.

Example: (using package.json scripts)
```sh
npm test
```

# Maintainers

- [Hugo Mallet](https://github.com/hugomallet)
- [François Michaudon](https://github.com/francois06)
