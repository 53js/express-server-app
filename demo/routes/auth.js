const Boom = require('@hapi/boom');
const express = require('express');

const { validator, wrapAsync: wa } = require('../..');

const router = express.Router();

const users = [
	{
		id: 1, email: 'admin@demo.com', password: 'secret', role: 'admin',
	},
	{
		id: 2, email: 'user@demo.com', password: 'pass', role: 'user',
	},
];

const loginSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
		password: { type: 'string', minLength: 1 },
	},
	required: ['email', 'password'],
};

router.post(
	'/login',
	validator().validate({ body: loginSchema }),
	wa(async (req, res) => {
		const { email, password } = req.body;
		const user = users.find((u) => u.email === email && u.password === password);
		if (!user) throw Boom.unauthorized('Invalid credentials');
		const { password: _pwd, ...safeUser } = user;
		res.json({ token: `fake-token-${safeUser.id}`, user: safeUser });
	}),
);

module.exports = router;
