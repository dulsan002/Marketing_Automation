const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const { authenticate } = require('../auth/auth.middleware');

router.post('/', authenticate, eventController.create);
router.get('/', authenticate, eventController.getAll);
router.get('/analytics', authenticate, eventController.getAnalytics); // NEW: Analytics Endpoint
router.get('/registrations', authenticate, eventController.getAllRegistrants); // Must be before /:id
router.get('/:id', authenticate, eventController.getOne);
router.put('/:id', authenticate, eventController.update);
// sub-resources
router.post('/:id/register', authenticate, eventController.register);
router.get('/:id/registrations', authenticate, eventController.getRegistrants);
router.put('/:id/registrations/:regId', authenticate, eventController.updateRegistrationStatus);

module.exports = router;
