const { sequelize } = require('./src/config/database');
const Account = require('./src/modules/abm/account.model');
const { Op } = require('sequelize');

async function fixNA() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        // 1. Replace explicit "N/A" strings
        const [updatedNA] = await Account.update({
            industry: 'Technology'
        }, {
            where: {
                industry: 'N/A'
            }
        });
        console.log(`Updated ${updatedNA} accounts with 'N/A' industry`);

        // 2. Ensuring NULLs are covered (though Service handles this, DB clean is good)
        const [updatedNull] = await Account.update({
            industry: 'Technology'
        }, {
            where: {
                industry: { [Op.is]: null }
            }
        });
        console.log(`Updated ${updatedNull} accounts with NULL industry`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

fixNA();
