const express = require('express');
const router = express.Router();
const accountController = require('./account.controller');
const { authenticate } = require('../auth/auth.middleware');

// Specific Global Routes (Must come BEFORE /:id)
router.get('/analytics', authenticate, accountController.getAnalytics);
router.get('/intent-signals', authenticate, accountController.getIntentSignals);
router.get('/buying-committees', authenticate, accountController.getBuyingCommittees);

// Resource Routes
router.post('/', authenticate, accountController.create);
router.get('/', authenticate, accountController.getAll);
router.get('/:id', authenticate, accountController.getOne);
router.patch('/:id', authenticate, accountController.update);
router.post('/:id/intent', authenticate, accountController.refreshIntent);
router.post('/:id/members', authenticate, accountController.addMember);
router.patch('/:id/members/:memberId', authenticate, accountController.updateMember);
router.delete('/:id/members/:memberId', authenticate, accountController.deleteMember);

module.exports = router;
