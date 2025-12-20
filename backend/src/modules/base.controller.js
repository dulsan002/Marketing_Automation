const tenantService = require('./tenants/tenant.service');
const contactService = require('./contacts/contact.service');

// Tenants
exports.createTenant = async (req, res, next) => {
    try {
        const tenant = await tenantService.createTenant(req.body);
        res.status(201).json({ status: 'success', data: tenant });
    } catch (error) {
        next(error);
    }
};

exports.getAllTenants = async (req, res, next) => {
    try {
        const tenants = await tenantService.getAllTenants();
        res.status(200).json({ status: 'success', data: tenants });
    } catch (error) {
        next(error);
    }
};

// Contacts
exports.createContact = async (req, res, next) => {
    try {
        const contact = await contactService.createContact(req.body);
        res.status(201).json({ status: 'success', data: contact });
    } catch (error) {
        next(error);
    }
};

exports.getContacts = async (req, res, next) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) {
            return res.status(400).json({ status: 'error', message: 'TenantId is required' });
        }
        const contacts = await contactService.getContactsByTenant(tenantId);
        res.status(200).json({ status: 'success', count: contacts.length, data: contacts });
    } catch (error) {
        next(error);
    }
};
