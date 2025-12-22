const { sequelize } = require('./src/config/database');
const Account = require('./src/modules/abm/account.model');
const Tenant = require('./src/modules/tenants/tenant.model');
const IntentSignal = require('./src/modules/abm/intent_signal.model');

const testQuery = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Simulate the query likely used in GET /api/abm/accounts
        // Usually involves finding accounts for a tenant
        const accounts = await Account.findAll({
            limit: 5,
            include: [
                { model: Tenant, required: true }
            ]
        });
        console.log(`Found ${accounts.length} accounts. Query Success.`);

        // Check Intent Signals too
        const signals = await IntentSignal.findAll({
            limit: 5
        });
        console.log(`Found ${signals.length} intent signals.`);

    } catch (error) {
        console.error('TEST FAIL:', error);
    } finally {
        process.exit();
    }
};

testQuery();
