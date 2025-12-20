const { sequelize } = require('../backend/src/config/database');
const Account = require('../backend/src/modules/abm/account.model');

const UPDATES = {
    'TechFlow Systems': { country: 'USA', intentScore: 85 },
    'Innosphere Labs': { country: 'Germany', intentScore: 60 },
    'DataVantage Corp': { country: 'UK', intentScore: 92 },
    'CloudScale Solutions': { country: 'Canada', intentScore: 45 },
    'Nebula Innovations': { country: 'France', intentScore: 70 },
    'Globex Corp': { country: 'USA', intentScore: 50 },
    'Stark Industries': { country: 'USA', intentScore: 88 }
};

async function updateFields() {
    try {
        console.log('🔄 Updating Account Fields...');

        // 1. Update known specific accounts
        for (const [name, data] of Object.entries(UPDATES)) {
            await Account.update(data, { where: { name: name } });
            console.log(`   Updated ${name}`);
        }

        // 2. Bulk update any remaining NULLs
        await Account.update({ country: 'USA', intentScore: 25 }, { where: { country: null } });

        console.log('✅ Accounts Updated.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
updateFields();
