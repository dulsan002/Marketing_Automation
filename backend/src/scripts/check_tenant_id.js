const { Sequelize } = require('sequelize');
const path = require('path');

async function check() {
    const dbPath = path.join(__dirname, '../../database_new.sqlite');
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Connected.');

        const [results] = await sequelize.query("PRAGMA table_info(Events);");
        // console.log(results);

        const hasTenantId = results.some(r => r.name === 'TenantId');
        if (hasTenantId) {
            console.log('✅ TenantId column EXISTS.');
        } else {
            console.log('❌ TenantId column MISSING!');
            console.log('Columns found:', results.map(r => r.name).join(', '));
        }

    } catch (e) {
        console.log(`❌ Error - ${e.message}`);
    }
}

check();
