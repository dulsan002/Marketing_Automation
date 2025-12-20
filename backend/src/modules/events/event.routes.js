const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const { authenticate } = require('../auth/auth.middleware');

router.post('/', authenticate, eventController.create);
router.get('/', authenticate, eventController.getAll);
router.get('/:id', authenticate, eventController.getOne);
// sub-resources
router.post('/:id/register', authenticate, eventController.register);
router.get('/:id/registrations', authenticate, eventController.getRegistrants);

module.exports = router;
