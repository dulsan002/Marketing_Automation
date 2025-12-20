const eventService = require('./event.service');

const create = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const event = await eventService.createEvent({ ...req.body, TenantId: tenantId });
        res.status(201).json({ status: 'success', data: event });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const events = await eventService.getEvents(tenantId);
        res.status(200).json({ status: 'success', data: events });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getOne = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const event = await eventService.getEventById(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: event });
    } catch (error) {
        if (error.message === 'Event not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const register = async (req, res) => {
    try {
        const { contactId } = req.body;
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });
        if (!contactId) return res.status(400).json({ status: 'error', message: 'ContactID is required' });

        const registration = await eventService.registerContact(req.params.id, contactId, tenantId);
        res.status(200).json({ status: 'success', data: registration });
    } catch (error) {
        if (error.message === 'Event not found' || error.message === 'Contact not found') {
            return res.status(404).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getRegistrants = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const registrants = await eventService.getRegistrations(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: registrants });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getOne,
    register,
    getRegistrants
};
