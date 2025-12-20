const { sequelize } = require('../backend/src/config/database');
const Account = require('../backend/src/modules/abm/account.model');

async function sync() {
    try {
        console.log('🔄 Syncing Account Schema (Alter)...');
        await Account.sync({ alter: true });
        console.log('✅ Account Schema Updated.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
sync();
