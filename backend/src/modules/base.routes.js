const express = require('express');
const router = express.Router();
const baseController = require('./base.controller');

// Tenant Routes
router.post('/tenants', baseController.createTenant);
router.get('/tenants', baseController.getAllTenants);

// Contact Routes
router.post('/contacts', baseController.createContact);
router.get('/contacts', baseController.getContacts);

module.exports = router;
