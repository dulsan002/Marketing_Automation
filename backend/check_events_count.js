const { sequelize } = require('./src/config/database');
const Event = require('./src/modules/events/event.model');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to:', sequelize.options.storage);

        const count = await Event.count();
        console.log(`📊 Total Events in DB: ${count}`);

        if (count > 0) {
            const events = await Event.findAll({ limit: 3 });
            console.log('Samples:', JSON.stringify(events.map(e => ({ id: e.id, name: e.name, status: e.status })), null, 2));
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        // process.exit();
    }
}

check();
