const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { authenticate } = require('../auth/auth.middleware');

router.get('/campaigns/:id', authenticate, analyticsController.getCampaignAnalytics);
router.get('/accounts/:id', authenticate, analyticsController.getAccountAnalytics);
router.get('/events/:id', authenticate, analyticsController.getEventAnalytics);

module.exports = router;
