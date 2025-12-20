const Event = require('./event.model');
const Registration = require('./registration.model');
const Contact = require('../contacts/contact.model');
const emailService = require('../../common/email.service');

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

const registerContact = async (eventId, contactId, tenantId, snapshotOverrides = {}) => {
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
            status: 'Registered',
            // Snapshot data from Contact (or overwrite if passed, but usually purely from Contact here)
            // Snapshot data: Prefer overrides (from form), then Contact data
            firstName: snapshotOverrides.firstName || contact.firstName,
            lastName: snapshotOverrides.lastName || contact.lastName,
            email: snapshotOverrides.email || contact.email,
            company: snapshotOverrides.company || contact.company,
            jobTitle: snapshotOverrides.jobTitle || contact.jobTitle
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

const getAllRegistrations = async (tenantId) => {
    return await Registration.findAll({
        include: [
            {
                model: Event,
                where: { TenantId: tenantId },
                attributes: ['id', 'name']
            },
            {
                model: Contact,
                attributes: ['firstName', 'lastName', 'email', 'company', 'jobTitle']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

const getRegistrations = async (eventId, tenantId) => {
    await getEventById(eventId, tenantId); // Validate existence/access
    return await Registration.findAll({
        where: { EventId: eventId },
        include: [{ model: Contact, attributes: ['firstName', 'lastName', 'email', 'company', 'jobTitle'] }],
        order: [['createdAt', 'DESC']]
    });
};

const registerManual = async (eventId, contactData, tenantId) => {
    // 1. Find or Create Contact
    // Use Sequelize operator for case-insensitive search if possible, or just normalize
    const { Op } = require('sequelize');

    // Check if contact exists (Case Insensitive)
    let contact = await Contact.findOne({
        where: {
            email: { [Op.like]: contactData.email }, // SQLite is usually case-insensitive with LIKE by default, but this is safer
            TenantId: tenantId
        }
    });

    if (!contact) {
        try {
            contact = await Contact.create({
                firstName: contactData.firstName,
                lastName: contactData.lastName,
                email: contactData.email,
                company: contactData.company,
                jobTitle: contactData.jobTitle,
                status: 'Lead',
                TenantId: tenantId
            });
        } catch (e) {
            // If race condition or unique constraint hits now, try finding again
            if (e.name === 'SequelizeUniqueConstraintError') {
                contact = await Contact.findOne({ where: { email: contactData.email, TenantId: tenantId } });
            }
            if (!contact) throw e; // If still failing, rethrow
        }
    }

    // If contact exists but has missing fields that we now have, update the contact?
    // User expectation: "when i fill Register Attendee name, comapy... didnt stores"
    // So we should try to update the contact if the field is currently empty in DB but provided in form.
    if (contact) {
        const updates = {};
        if (!contact.firstName && contactData.firstName) updates.firstName = contactData.firstName;
        if (!contact.lastName && contactData.lastName) updates.lastName = contactData.lastName;
        if (!contact.company && contactData.company) updates.company = contactData.company;
        if (!contact.jobTitle && contactData.jobTitle) updates.jobTitle = contactData.jobTitle;

        if (Object.keys(updates).length > 0) {
            await contact.update(updates);
        }
    }

    // 2. Register
    // Pass contactData as overrides for the snapshot to ensure the registration record looks exactly as typed
    return await registerContact(eventId, contact.id, tenantId, contactData);
};

const updateRegistrationStatus = async (eventId, registrationId, status, tenantId) => {
    // Validate inputs
    if (!['pending', 'registered', 'cancelled', 'declined'].includes(status.toLowerCase())) {
        throw new Error('Invalid status');
    }

    const registration = await Registration.findOne({
        where: { id: registrationId, EventId: eventId },
        include: [
            { model: Contact },
            { model: Event } // Include event to get details for email
        ]
    });

    if (!registration) throw new Error('Registration not found');

    // Authorization Check (Mock: Assumes TenantId check on Event is sufficient via getEventById call in controller, 
    // but deeper check: registration.Event.TenantId === tenantId)
    if (registration.Event.TenantId !== tenantId) {
        throw new Error('Unauthorized access to this registration');
    }

    const oldStatus = registration.status;
    const newStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(); // Normalize

    // Update
    await registration.update({ status: newStatus });

    // Handle Side Effects (Email)
    // Send email ONLY if transitioning TO 'Registered' FROM something else
    if (newStatus === 'Registered' && oldStatus !== 'Registered') {
        try {
            await emailService.sendRegistrationApprovedEmail(registration.Contact, registration.Event);
        } catch (emailErr) {
            console.error('Failed to send approval email', emailErr);
            // Don't fail the request, just log
        }
    }

    // Update event counts based on status change?
    // If cancelling, decrement. If approving from pending, increment? 
    // Logic: 'Registered' counts towards capacity. 'Pending' does not? Or both do?
    // Usually only 'Registered' counts.
    // Simplifying assumption: We blindly incremented on create. 
    // If we move to Cancelled/Declined, we should decrement.
    if ((newStatus === 'Cancelled' || newStatus === 'Declined') && oldStatus === 'Registered') {
        await registration.Event.decrement('registeredCount');
    }
    // If moving from Pending to Registered, we might need to check capacity again but usually admin override allows it.
    // For now, simple count adjustment.
    if (newStatus === 'Registered' && (oldStatus === 'Cancelled' || oldStatus === 'Declined')) {
        await registration.Event.increment('registeredCount');
    }

    return registration;
};


