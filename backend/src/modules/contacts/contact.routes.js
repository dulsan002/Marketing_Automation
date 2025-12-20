const express = require('express');
const router = express.Router();
const contactController = require('./contact.controller');
const { authenticate } = require('../auth/auth.middleware');

router.use(authenticate);

router.post('/', contactController.createContact);
router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContactById);
router.patch('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
