
const { sequelize } = require('./src/config/database');

const inspect = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Get table info for Contacts
        const [results, metadata] = await sequelize.query("PRAGMA table_info(Contacts);");

        console.log('--- Contacts Table Schema ---');
        // Find AccountId column
        const accountIdCol = results.find(c => c.name === 'AccountId');
        if (accountIdCol) {
            console.log('AccountId Column:', accountIdCol);
            console.log('Current state: ' + (accountIdCol.notnull === 1 ? 'NOT NULL (Constraint Active)' : 'NULLABLE (OK)'));
        } else {
            console.log('AccountId column NOT FOUND!');
        }

    } catch (e) {
        console.error('INSPECT FAILED:', e);
    } finally {
        await sequelize.close();
    }
};

inspect();
