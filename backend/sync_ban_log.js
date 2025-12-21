const { sequelize } = require('./src/config/database');
const BanLog = require('./src/modules/events/ban-log.model');

async function syncBanLog() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        await BanLog.sync({ alter: true });
        console.log('✅ BanLog table synced');
    } catch (e) {
        console.error('❌ Sync failed:', e);
    }
}

syncBanLog();
