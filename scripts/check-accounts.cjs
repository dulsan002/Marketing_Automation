const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const Account = require('../backend/src/modules/abm/account.model');

async function checkAccounts() {
    try {
        const tenants = await Tenant.findAll();
        console.log('📊 Account Distribution by Tenant:');
        console.log('-----------------------------------');

        for (const t of tenants) {
            const count = await Account.count({ where: { TenantId: t.id } });
            console.log(`Tenant: ${t.name} (${t.slug}) -> ${count} Accounts`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkAccounts();
