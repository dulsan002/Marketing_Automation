const { sequelize } = require('./src/config/database');

const testRaw = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // RAW SQL Check
        const [results, metadata] = await sequelize.query("SELECT id, createdAt, updatedAt FROM Accounts WHERE createdAt IS NULL OR updatedAt IS NULL");
        console.log(`Found ${results.length} accounts with NULL dates.`);
        results.forEach(r => console.log(r));

        const [results2, metadata2] = await sequelize.query("SELECT id, createdAt, updatedAt FROM Accounts");
        results2.forEach(r => {
            if (typeof r.createdAt !== 'string' || typeof r.updatedAt !== 'string') {
                console.log(`Type Mismatch ID: ${r.id}, Created: ${typeof r.createdAt}, Updated: ${typeof r.updatedAt}, Val: ${r.createdAt}`);
            }
        });

    } catch (error) {
        console.error('RAW TEST FAIL:', error);
    } finally {
        process.exit();
    }
};

testRaw();
