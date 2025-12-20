const express = require('express');
const router = express.Router();
const campaignController = require('./campaign.controller');
const { authenticate, authorize } = require('../auth/auth.middleware');

router.get('/', authenticate, campaignController.getAll);
router.get('/:id', authenticate, campaignController.getOne);

router.post('/', authenticate, authorize(['editor']), campaignController.create);
router.patch('/:id', authenticate, authorize(['editor']), campaignController.update);
router.post('/:id/activate', authenticate, authorize(['editor']), campaignController.activate);

// Strict safety: Only admin can archive manually (or system)
router.post('/:id/archive', authenticate, authorize([]), campaignController.archive); // Empty array = Only Admin (since logic 'admin' is always allowed)

module.exports = router;
