const { Sequelize } = require('sequelize');
const path = require('path');

async function check(filename) {
    const dbPath = path.join(__dirname, '../../', filename);
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });

    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT count(*) as count FROM Events");
        console.log(`📊 ${filename}: ${results[0].count} events`);

        // Check for venue column
        try {
            await sequelize.query("SELECT venue FROM Events LIMIT 1");
            console.log(`   ✅ ${filename} has 'venue' column`);
        } catch (e) {
            console.log(`   ❌ ${filename} MISSING 'venue' column`);
        }

    } catch (e) {
        console.log(`❌ ${filename}: Error - ${e.message}`);
    }
}

async function run() {
    console.log('Checking databases...');
    await check('database.sqlite');
    await check('database_new.sqlite');
}

run();
