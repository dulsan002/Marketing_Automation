const { sequelize } = require('../config/database');
const Event = require('../modules/events/event.model');

async function fix() {
    try {
        console.log('🔌 Connecting...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        console.log('🛠️ Syncing Event model (ALTER user)...');
        await Event.sync({ alter: true });
        console.log('✅ Sync complete.');

    } catch (e) {
        console.error('❌ Sync failed:', e);
    } finally {
        await sequelize.close();
    }
}

fix();
