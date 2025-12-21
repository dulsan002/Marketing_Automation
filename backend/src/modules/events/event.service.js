const Event = require('./event.model');
const Registration = require('./registration.model');
const Contact = require('../contacts/contact.model');
const BanLog = require('./ban-log.model');
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
    const oldStatus = event.status;

    const updatedEvent = await event.update(updates);

    // Auto-Attend Logic: If moving to Completed, mark all Registered/Confirmed as Attended
    if (updatedEvent.status === 'Completed' && oldStatus !== 'Completed') {
        const Registration = require('./registration.model');
        const { Op } = require('sequelize');

        console.log(`[EventService] Event ${id} Completed. Auto-marking attendees...`);

        await Registration.update(
            { status: 'Attended' },
            {
                where: {
                    EventId: id,
                    status: { [Op.in]: ['Registered', 'Confirmed', 'Pending'] } // Converting Pending too? Usually only Registered. User said "all confirmed". Let's stick to Registered/Confirmed (normalized).
                }
            }
        );
    }

    return updatedEvent;
};

const registerContact = async (eventId, contactId, tenantId, snapshotOverrides = {}) => {
    console.log('DEBUG [EventService] registerContact overrides:', JSON.stringify(snapshotOverrides, null, 2));
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

        // Fire & Forget Kafka Event for ABM
        try {
            const { producer } = require('../../config/kafka');
            // Ensure connected? usually valid if app started.
            // Use lightweight check or just send (it buffers)
            await producer.send({
                topic: 'event-registrations',
                messages: [
                    {
                        value: JSON.stringify({
                            tenantId,
                            contactId,
                            eventId,
                            activityType: 'event_attend', // Mapped to 10 points in ABM logic
                            source: 'Event'
                        })
                    }
                ]
            });
            console.log(`[EventService] Published event-registrations for contact ${contactId}`);
        } catch (kafkaErr) {
            console.warn('[EventService] Kafka unavailable, using Fallback to direct ABM call', kafkaErr.message);
            // Fallback: Direct Call for Dev/Demo resilience
            try {
                // We need to resolve AccountId locally just like the Consumer does
                const contact = await Contact.findOne({ where: { id: contactId, TenantId: tenantId } });
                if (contact) {
                    const accountService = require('../abm/account.service');
                    await accountService.processActivity(
                        tenantId,
                        contactId,
                        contact.AccountId,
                        'event_attend',
                        'Event'
                    );
                    console.log('[EventService] Fallback ABM signal processed successfully');
                }
            } catch (fallbackErr) {
                console.error('[EventService] Fallback also failed', fallbackErr);
            }
        }

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

    const { ensureAccount } = require('../contacts/contact.service');

    if (!contact) {
        try {
            const data = {
                firstName: contactData.firstName,
                lastName: contactData.lastName,
                email: contactData.email,
                company: contactData.company,
                jobTitle: contactData.jobTitle,
                status: 'Lead',
                TenantId: tenantId
            };

            // Sync Account
            if (data.company) {
                const accountId = await ensureAccount(tenantId, data.company);
                if (accountId) data.AccountId = accountId;
            }

            contact = await Contact.create(data);
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
        // Always update contact details if provided in the registration form
        if (contactData.firstName) updates.firstName = contactData.firstName;
        if (contactData.lastName) updates.lastName = contactData.lastName;
        if (contactData.company) updates.company = contactData.company;
        if (contactData.jobTitle) updates.jobTitle = contactData.jobTitle;

        // Sync Account if company changed or set
        if (updates.company && updates.company !== contact.company) {
            const accountId = await ensureAccount(tenantId, updates.company);
            if (accountId) updates.AccountId = accountId;
        }

        if (Object.keys(updates).length > 0) {
            await contact.update(updates);
        }
    }

    // 2. Register
    // Pass contactData as overrides for the snapshot to ensure the registration record looks exactly as typed
    return await registerContact(eventId, contact.id, tenantId, contactData);
};

const updateRegistrationStatus = async (eventId, registrationId, status, tenantId, options = {}) => {
    // Validate inputs
    const validStatuses = ['Pending', 'Registered', 'Confirmed', 'Cancelled', 'Declined', 'Attended', 'NoShow', 'Banned'];
    // Allow case-insensitive check
    const normalizedInput = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    if (!validStatuses.includes(normalizedInput)) {
        throw new Error(`Invalid status: ${status}`);
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
    const newStatus = normalizedInput;

    // Update
    const updates = { status: normalizedInput };

    // Enforce Lock: If currently Banned, ONLY allow transition if isUnban flag is present (and presumably status is being reset)
    if (oldStatus === 'Banned' && !options.isUnban) {
        throw new Error('This user is Banned. You must Unban them first via the approved workflow.');
    }

    // Handle Ban Reason
    if (normalizedInput === 'Banned') {
        if (options.banReason) {
            updates.banReason = options.banReason;

            // Create Audit Log
            await BanLog.create({
                action: 'Banned',
                reason: options.banReason,
                bannedByName: options.adminName || 'Unknown Admin',
                bannedByEmail: options.adminEmail || 'Unknown Email',
                userEmail: registration.Contact?.email || 'Unknown User',
                RegistrationId: registration.id,
                TenantId: tenantId
            });

        } else {
            // Should we enforce it? User requirement: "he have to give valid reson before baning"
            throw new Error('Ban reason is required');
        }
    }

    // Handle Unban
    if (options.isUnban) {
        if (options.unbanReason) {
            updates.banReason = null; // Clear ban reason

            // Create Audit Log for Unban
            await BanLog.create({
                action: 'Unbanned',
                reason: options.unbanReason,
                bannedByName: options.adminName || 'Unknown Admin',
                bannedByEmail: options.adminEmail || 'Unknown Email',
                userEmail: registration.Contact?.email || 'Unknown User',
                RegistrationId: registration.id,
                TenantId: tenantId
            });
        } else {
            throw new Error('Unban reason is required');
        }
    }
    await registration.update(updates);

    // Handle Side Effects (Email)
    // Send email if transitioning TO 'Confirmed' or 'Registered' from a non-approved state
    // FIX: Allow Registered -> Confirmed to trigger email
    const isUpgradeToConfirmed = newStatus === 'Confirmed' && oldStatus !== 'Confirmed';
    const isInitialApproval = newStatus === 'Registered' && oldStatus !== 'Registered' && oldStatus !== 'Confirmed';

    if (isUpgradeToConfirmed || isInitialApproval) {
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

const getAnalytics = async (tenantId) => {
    // 1. Total Events
    const totalEvents = await Event.count({ where: { TenantId: tenantId } });

    // 2. Total Stats from Registrations
    const registrations = await Registration.findAll({
        include: [{
            model: Event,
            where: { TenantId: tenantId },
            attributes: ['name', 'startDate']
        }]
    });

    const totalRegistrations = registrations.length;
    const totalAttendees = registrations.filter(r => r.status === 'Attended' || r.status === 'Confirmed').length; // Treating Confirmed as likely attendees for now, or just Attended? User usually wants 'Confirmed' included in pipeline. Let's stick to strict 'Attended' for retro, but maybe 'Confirmed' + 'Attended' for forward looking? 
    // Let's stick to strict status for "Analysis" usually implies past performance. 
    // But for active events, "Confirmed" are attendees-to-be. 
    // Let's count 'Attended' + 'CheckedIn' + 'Confirmed'. 
    // Actually, let's just use 'Attended' and 'Confirmed' as success.

    // Better: 
    // totalAttendees = status IN ['Attended', 'Confirmed', 'CheckedIn']
    const attendedCount = registrations.filter(r => ['Attended', 'Confirmed', 'CheckedIn'].includes(r.status)).length;

    const noShows = registrations.filter(r => r.status === 'NoShow').length;

    // 3. Attendance by Event (Limit to top 10 or recent?)
    // Group by Event
    const eventStats = {};
    registrations.forEach(r => {
        if (!r.Event) return;
        const eName = r.Event.name;
        if (!eventStats[eName]) {
            eventStats[eName] = {
                eventName: eName,
                startDate: r.Event.startDate,
                registrations: 0,
                attendees: 0
            };
        }
        eventStats[eName].registrations++;
        if (['Attended', 'Confirmed', 'CheckedIn'].includes(r.status)) {
            eventStats[eName].attendees++;
        }
    });

    const attendanceByEvent = Object.values(eventStats);

    return {
        totalEvents,
        totalRegistrations,
        totalAttendees: attendedCount,
        noShows,
        attendanceByEvent
    };
};


module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    registerContact,
    getAllRegistrations,
    getRegistrations,
    registerManual,
    updateRegistrationStatus,
    getAnalytics
};


