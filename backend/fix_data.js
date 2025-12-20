const { sequelize } = require('./src/config/database');
const Account = require('./src/modules/abm/account.model');

async function fixData() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        // Fix "Account 1"
        const [updated] = await Account.update({
            name: 'Apex Innovations',
            industry: 'Cloud Infrastructure',
            intentScore: 42,
            tier: 'Tier 1',
            intentTrend: 'Stable',
            intentSources: ['Website', 'G2']
        }, {
            where: { name: 'Account 1' }
        });

        console.log(`Updated ${updated} accounts named 'Account 1'`);

        // Ensure all T1/T2 have at least some score/industry
        await Account.update({
            industry: 'SaaS Platform'
        }, {
            where: { industry: null }
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

fixData();
