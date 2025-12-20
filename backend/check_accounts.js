const { sequelize } = require('./src/config/database');
const Account = require('./src/modules/abm/account.model');
const Tenant = require('./src/modules/auth/tenant.model');

async function checkAccounts() {
    try {
        await sequelize.authenticate();
        const tenant = await Tenant.findOne({ where: { slug: 'demo-corp' } });
        if (!tenant) {
            console.error('Tenant demo-corp not found');
            return;
        }

        const accounts = await Account.findAll({
            where: { TenantId: tenant.id },
            attributes: ['id', 'name', 'tier', 'intentScore', 'industry', 'intentSources']
        });

        console.log(`Found ${accounts.length} accounts for demo-corp:`);
        accounts.forEach(a => {
            console.log(`- [${a.tier}] ${a.name} | Score: ${a.intentScore} | Ind: ${a.industry} | Src: ${JSON.stringify(a.intentSources)}`);
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

checkAccounts();
