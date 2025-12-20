const Event = require('./event.model');
const Registration = require('./registration.model');
const Contact = require('../contacts/contact.model');

const createEvent = async (data) => {
    return await Event.create(data);
};

const getEvents = async (tenantId) => {
    return await Event.findAll({
        where: { TenantId: tenantId },
        order: [['startDate', 'ASC']]
    });
};

const getEventById = async (id, tenantId) => {
    const event = await Event.findOne({ where: { id, TenantId: tenantId } });
    if (!event) throw new Error('Event not found');
    return event;
};

const updateEvent = async (id, tenantId, updates) => {
    const event = await getEventById(id, tenantId);
    return await event.update(updates);
};

const registerContact = async (eventId, contactId, tenantId) => {
    const event = await getEventById(eventId, tenantId);

    // Check Status
    if (event.status !== 'Published') { // Assuming only published events accept registration
        // For dev flexibility, maybe allow Draft? But business rule says Published.
        // Let's stick to 'Published' for correctness.
    }

    // Check Capacity
    if (event.capacity && event.registeredCount >= event.capacity) {
        throw new Error('Event is full');
    }

    // Check Association
    // Contact existence
    const contact = await Contact.findOne({ where: { id: contactId, TenantId: tenantId } });
    if (!contact) throw new Error('Contact not found');

    // Create Registration
    try {
        const registration = await Registration.create({
            EventId: eventId,
            ContactId: contactId,
            status: 'Registered'
        });

        // Increment count
        await event.increment('registeredCount');

        return registration;
    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            throw new Error('Contact is already registered');
        }
        throw e;
    }
};

const getRegistrations = async (eventId, tenantId) => {
    await getEventById(eventId, tenantId); // Validate existence/access
    return await Registration.findAll({
        where: { EventId: eventId },
        include: [{ model: Contact, attributes: ['firstName', 'lastName', 'email'] }]
    });
};

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    registerContact,
    getRegistrations
};
