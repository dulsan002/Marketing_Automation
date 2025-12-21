const express = require('express');
const router = express.Router();
const segmentController = require('./segment.controller');
const { authenticate } = require('../auth/auth.middleware');

router.post('/', authenticate, segmentController.create);
router.get('/', authenticate, segmentController.getAll);
router.get('/:id', authenticate, segmentController.getOne);
router.patch('/:id', authenticate, segmentController.update);
router.delete('/:id', authenticate, segmentController.remove);
router.post('/:id/calculate', authenticate, segmentController.calculate);
router.post('/preview', authenticate, segmentController.preview);

module.exports = router;
