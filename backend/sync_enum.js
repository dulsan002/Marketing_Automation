const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');

async function syncEnum() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');
        // Alter table to update ENUM
        await Registration.sync({ alter: true });
        console.log('✅ Registration table synced (Enum Updated)');
    } catch (e) {
        console.error('❌ Sync failed:', e);
    }
}

syncEnum();
