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
        const { contactId, email, firstName, lastName, company, jobTitle } = req.body;
        console.log('DEBUG [EventController] register req.body:', JSON.stringify(req.body, null, 2));
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        let registration;

        if (contactId) {
            registration = await eventService.registerContact(req.params.id, contactId, tenantId, { firstName, lastName, email, company, jobTitle });
        } else if (email) {
            // Manual / Public Registration
            registration = await eventService.registerManual(req.params.id, { email, firstName, lastName, company, jobTitle }, tenantId);
        } else {
            return res.status(400).json({ status: 'error', message: 'ContactID or Email is required' });
        }

        res.status(200).json({ status: 'success', data: registration });
    } catch (error) {
        if (error.message === 'Event not found' || error.message === 'Contact not found') {
            return res.status(404).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};



const getAllRegistrants = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const registrants = await eventService.getAllRegistrations(tenantId);
        res.status(200).json({ status: 'success', data: registrants });
    } catch (error) {
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

const update = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const updatedEvent = await eventService.updateEvent(req.params.id, tenantId, req.body);
        res.status(200).json({ status: 'success', data: updatedEvent });
    } catch (error) {
        if (error.message === 'Event not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const updateRegistrationStatus = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const { status } = req.body;
        if (!status) return res.status(400).json({ status: 'error', message: 'Status is required' });

        const updatedReg = await eventService.updateRegistrationStatus(req.params.id, req.params.regId, status, tenantId, req.body);
        res.status(200).json({ status: 'success', data: updatedReg });
    } catch (error) {
        if (error.message === 'Registration not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getOne,
    update,
    register,
    getRegistrants,
    getAllRegistrants,
    updateRegistrationStatus
};
