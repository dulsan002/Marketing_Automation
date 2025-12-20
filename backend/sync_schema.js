const { sequelize } = require('./src/config/database');
const Account = require('./src/modules/abm/account.model');
const Tenant = require('./src/modules/auth/tenant.model');
const IntentSignal = require('./src/modules/abm/intent_signal.model');

async function syncSchema() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected. Syncing...');

        // Use ALTER to add missing columns without dropping data
        await sequelize.sync({ alter: true });

        console.log('Schema Sync Complete.');

    } catch (e) {
        console.error('Sync Error:', e);
    } finally {
        process.exit();
    }
}

syncSchema();
