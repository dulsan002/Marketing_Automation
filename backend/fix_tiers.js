const { sequelize } = require('./src/config/database');
const Account = require('./src/modules/abm/account.model');

async function fixTiers() {
    try {
        await sequelize.authenticate();
        console.log('Fixing Tiers...');

        // Fix T1 -> Tier 1
        const [t1] = await Account.update({ tier: 'Tier 1' }, { where: { tier: 'T1' } });
        console.log(`Fixed ${t1} T1 accounts`);

        // Fix T2 -> Tier 2
        const [t2] = await Account.update({ tier: 'Tier 2' }, { where: { tier: 'T2' } });
        console.log(`Fixed ${t2} T2 accounts`);

        // Fix T3 -> Tier 3
        const [t3] = await Account.update({ tier: 'Tier 3' }, { where: { tier: 'T3' } });
        console.log(`Fixed ${t3} T3 accounts`);

    } catch (e) {
        console.error('Error fixing tiers:', e);
    } finally {
        process.exit();
    }
}

fixTiers();
