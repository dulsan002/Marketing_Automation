const { Sequelize, QueryTypes } = require('sequelize');
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
});

async function inspectDatabase() {
    try {
        console.log('--- DATABASE SUMMARY ---');

        const tables = await sequelize.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
            { type: QueryTypes.SELECT }
        );

        for (const table of tables) {
            const [countObj] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.name};`, {
                type: QueryTypes.SELECT
            });
            process.stdout.write(`Table: ${table.name.padEnd(15)} | Records: ${countObj.count}\n`);

            if (countObj.count > 0) {
                const sample = await sequelize.query(`SELECT * FROM ${table.name} LIMIT 1;`, {
                    type: QueryTypes.SELECT
                }).catch(() => null);

                if (sample && sample.length > 0) {
                    console.log(`  Example: ${JSON.stringify(sample[0]).substring(0, 100)}...`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

inspectDatabase();
