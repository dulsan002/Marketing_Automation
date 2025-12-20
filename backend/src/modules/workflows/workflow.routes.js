const express = require('express');
const router = express.Router();
const workflowController = require('./workflow.controller');
const { authenticate, authorize } = require('../auth/auth.middleware');

router.get('/', authenticate, workflowController.getAll);
router.get('/:id', authenticate, workflowController.getOne);

router.post('/', authenticate, authorize(['editor']), workflowController.create);
router.patch('/:id', authenticate, authorize(['editor']), workflowController.update);

router.delete('/:id', authenticate, authorize([]), workflowController.remove); // Admin only
router.post('/:id/execute', authenticate, authorize([]), workflowController.execute); // Admin only

module.exports = router;
