const { sequelize } = require('./src/config/database');
require('./src/modules/auth/tenant.model');
require('./src/modules/contacts/contact.model');
require('./src/modules/abm/account.model');
require('./src/modules/abm/intent_signal.model');

async function testSync() {
    try {
        console.log('Testing sequelize.sync({ force: true })...');
        await sequelize.sync({ force: true });
        console.log('Sync successful!');
    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        process.exit();
    }
}

testSync();
