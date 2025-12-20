const contactService = require('./contact.service');

const createContact = async (req, res, next) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });
        const contact = await contactService.createContact({ ...req.body, TenantId: tenantId });
        res.status(201).json({ status: 'success', data: contact });
    } catch (error) {
        next(error);
    }
};

const getContacts = async (req, res, next) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });
        const contacts = await contactService.getContacts(tenantId);
        res.status(200).json({ status: 'success', data: contacts });
    } catch (error) {
        next(error);
    }
};

const getContactById = async (req, res, next) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });
        const contact = await contactService.getContactById(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: contact });
    } catch (error) {
        next(error);
    }
};

const updateContact = async (req, res, next) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });
        const contact = await contactService.updateContact(req.params.id, tenantId, req.body);
        res.status(200).json({ status: 'success', data: contact });
    } catch (error) {
        next(error);
    }
};

const deleteContact = async (req, res, next) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });
        await contactService.deleteContact(req.params.id, tenantId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createContact,
    getContacts,
    getContactById,
    updateContact,
    deleteContact
};
