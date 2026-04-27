# CLAUDE.md

## Project Overview

`express-server-app` is a minimal, opinionated framework for building Web and REST API servers on top of Express.js. It integrates best-practice libraries (logging, validation, security headers, CORS) into a cohesive package published on npm.

- **Version:** 0.5.3
- **License:** MIT
- **Author:** 53JS

## Tech Stack

- **Express.js** — core web framework
- **Pino** — structured JSON logging (`express-pino-logger` for middleware)
- **Helmet** — HTTP security headers
- **CORS** — cross-origin resource sharing
- **@hapi/boom** — HTTP error formatting
- **express-json-validator-middleware** (AJV) — JSON Schema validation
- **dotenv / dotenv-expand** — environment configuration
- **Nodemon** — development auto-reload
- **Jest** — testing framework
- **ESLint** — linting (extends `eslint-config-53js` + Airbnb)

## Directory Structure

```
express-server-app/
├── bin/express-server-app.js   # CLI entry point (start/debug/dist/test)
├── lib/
│   ├── __tests__/              # Jest tests + fixtures/
│   ├── helpers/index.js        # CORS whitelist parsing utility
│   ├── application.js          # Express app augmentation (fluent API)
│   ├── config.js               # Multi-file env configuration loader
│   ├── log.js                  # Pino singleton (redacts Authorization header)
│   ├── middlewares.js          # Middleware factories
│   ├── validator.js            # JSON Schema validator
│   ├── wrapAsync.js            # Async route handler wrapper
│   └── index.js                # Core exports
├── example/                    # Example server
├── index.js                    # Package entry point
└── index.test.js
```

## Key Exports (`lib/index.js`)

- `config` — multi-file env loader (`.env.NODE_ENV.local` → `.env`)
- `log()` — Pino logger singleton
- `validator()` — JSON Schema validator instance
- `wrapAsync(fn)` — wraps async route handlers for Express error propagation
- `application` — Express app augmentation with chainable methods
- `middlewares` — middleware factories (`getInitialMiddlewares`, `getApiFinalMiddlewares`)

## Package Manager

Always use **yarn** (never npm).

```bash
yarn               # install dependencies
yarn test          # jest --watchAll --coverage
```

Via the CLI binary (used from consumer packages):
```bash
express-server-app start   # nodemon + pino-pretty (development)
express-server-app debug   # nodemon + --inspect-brk (debug)
express-server-app dist    # plain node (production)
express-server-app test    # jest --coverage
```

## Running Tests

```bash
yarn test
```

Tests live in `lib/__tests__/`. The `fixtures/` subdirectory is excluded from coverage. A `.env.test` file is loaded for the test environment.

## Conventions

- **Tabs (4-wide)** — see `.editorconfig`
- No `import` statements inside `.mdx` files (stripped at parse time)
- `import.meta.glob` patterns must be top-level string literals (Vite constraint)
- No "Co-Authored-By" in git commits
- Keep solutions simple — avoid over-engineering
- Follow the code quality guidelines defined in the `review53` skill
- **Async handlers** must be wrapped with `wrapAsync()` for proper error propagation
- **Middleware chain order:** initial middlewares → routes → final middlewares (error handling)
- **Application methods** return `this` for fluent chaining
- **Authorization headers** are redacted in logs (security requirement — do not remove)
- Config loading follows create-react-app priority: `.env.NODE_ENV.local` > `.env.NODE_ENV` > `.env.local` > `.env`

## Linting

```bash
yarn eslint .
```

Config: `.eslintrc.js` — extends `53js`, `airbnb`, with Jest plugin enabled.

## CI/CD

CircleCI (`.circleci/config.yml`) with Code Climate integration.
