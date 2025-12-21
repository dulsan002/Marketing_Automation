const { sequelize } = require('./src/config/database');
const Event = require('./src/modules/events/event.model');

// Mock a Tenant ID (Replace with one you know exists or just a UUID string)
const TENANT_ID = 'default-tenant-id';

async function debug() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected');

        const eventService = require('./src/modules/events/event.service');
        console.log(`🔍 Querying Events via  Service for Tenant: ${TENANT_ID}`);

        const events = await eventService.getEvents(TENANT_ID);

        console.log('✅ Query Success!');
        console.log(`📊 Found ${events.length} events.`);
        if (events.length > 0) {
            console.log('Sample:', events[0].name);
        }

    } catch (e) {
        console.error('❌ Query Failed!');
        console.error('Name:', e.name);
        console.error('Message:', e.message);
        console.error('SQL:', e.sql); // If it's a sequelize error
        console.error('Stack:', e.stack);
    } finally {
        // process.exit();
    }
}

debug();
