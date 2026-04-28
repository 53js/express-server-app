const Boom = require('@hapi/boom');
const express = require('express');

const { validator, wrapAsync: wa } = require('../..');

const router = express.Router();

const items = [
	{ id: 1, name: 'Apple', price: 1.5 },
	{ id: 2, name: 'Banana', price: 0.75 },
	{ id: 3, name: 'Cherry', price: 3.0 },
];
let nextId = 4;

const itemSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
		price: { type: 'number', minimum: 0 },
	},
	required: ['name', 'price'],
};

router.get('/', (req, res) => {
	res.json(items);
});

router.get('/:id', wa(async (req, res) => {
	const id = parseInt(req.params.id, 10);
	const item = items.find((i) => i.id === id);
	if (!item) throw Boom.notFound(`Item ${id} not found`);
	res.json(item);
}));

router.post(
	'/',
	validator().validate({ body: itemSchema }),
	wa(async (req, res) => {
		const item = { id: nextId, ...req.body };
		nextId += 1;
		items.push(item);
		res.status(201).json(item);
	}),
);

router.delete('/:id', wa(async (req, res) => {
	const id = parseInt(req.params.id, 10);
	const index = items.findIndex((i) => i.id === id);
	if (index === -1) throw Boom.notFound(`Item ${id} not found`);
	items.splice(index, 1);
	res.status(204).send();
}));

module.exports = router;
