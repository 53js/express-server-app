const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { DOTENV_PATH = '.env', NODE_ENV } = process.env;
const envPath = path.resolve(DOTENV_PATH);

// Copied from : https://github.com/facebook/create-react-app/blob/25184c4e91ebabd16fe1cde3d8630830e4a36a01/packages/react-scripts/config/env.js
// -- begin --

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
// -- end --

const { CONFIG_DIR = 'config' } = process.env;
const configPath = path.resolve(`${CONFIG_DIR}/config-${NODE_ENV}.js`);

const config = {};
if (fs.existsSync(configPath)) {
	// eslint-disable-next-line import/no-dynamic-require
	Object.assign(config, require(configPath));
}

module.exports = config;
