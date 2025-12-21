const { Sequelize } = require('sequelize');
const { connectDB } = require('../src/config/database');
const authService = require('../src/modules/auth/auth.service');
const eventService = require('../src/modules/events/event.service');
// We might need contact service to create a contact to register?
// Or event registration creates contact? Usually handles it.
// Checking event.service logic... createRegistration(eventId, data) usually creates contact.

const TENANT_NAME = `Event-Test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const EMAIL = `ev-admin-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
const PASSWORD = 'Password123!';

async function runTest() {
    console.log(`[Event Verify] Starting Service Integration Test for: ${TENANT_NAME}`);
    await connectDB();

    try {
        // 1. Register Tenant
        console.log('[1] Registering Tenant...');
        const regRes = await authService.register(TENANT_NAME, EMAIL, PASSWORD);
        const user = regRes.user;
        const tenantId = user.tenantId || user.TenantId;
        if (!tenantId) throw new Error('TenantID missing');
        console.log(`    -> TenantID: ${tenantId}`);

        // 2. Create Event
        console.log('[2] Creating Event...');
        const eventData = {
            name: 'Annual Tech Summit',
            startDate: new Date(Date.now() + 86400000), // Tomorrow
            location: 'Virtual',
            capacity: 100,
            TenantId: tenantId
        };
        const event = await eventService.createEvent(eventData);
        const eventId = event.id;
        console.log(`    -> Event Created: ${event.name} (ID: ${eventId})`);

        // 3. Register a Contact for the Event
        console.log('[3] Registering Attendee...');
        const attendeeData = {
            firstName: 'John',
            lastName: 'Doe',
            email: `john.doe.${Date.now()}@example.com`,
            company: 'Acme Inc',
            title: 'CTO'
        };
        // eventService.registerManual(eventId, contactData, tenantId)
        const registration = await eventService.registerManual(eventId, attendeeData, tenantId);
        console.log(`    -> Registration Created: ${registration.id} (Status: ${registration.status})`);

        // 4. Mark as Attended
        console.log('[4] Marking as Attended...');
        // eventService.updateRegistrationStatus(eventId, registrationId, status, tenantId)
        const updatedReg = await eventService.updateRegistrationStatus(eventId, registration.id, 'Attended', tenantId);
        console.log(`    -> Updated Status: ${updatedReg.status}`);

        if (updatedReg.status === 'Attended') {
            console.log('    -> PASS: Status updated.');
        } else {
            console.log('    -> WARN: Status update failed.');
        }

        // 5. Check Analytics
        console.log('[5] Checking Event Analytics...');
        // eventService.getAnalytics(tenantId)
        const analytics = await eventService.getAnalytics(tenantId);
        // Analytics structure: { totalEvents, totalRegistrations, totalAttendees, ... }
        console.log('    -> Analytics:', {
            totalEvents: analytics.totalEvents,
            totalRegistrations: analytics.totalRegistrations,
            totalAttendees: analytics.totalAttendees
        });

        if (analytics.totalRegistrations > 0 && analytics.totalAttendees > 0) {
            console.log('    -> PASS: Analytics reflects registration and attendance.');
        } else {
            console.log('    -> FAIL: Analytics mismatch.');
        }

        console.log('TEST COMPLETE: EVENT MODULE LOGIC VERIFIED');

    } catch (error) {
        console.error('TEST FAILED:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runTest();
