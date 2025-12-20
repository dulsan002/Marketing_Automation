const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');
const fs = require('fs');

async function inspectDB() {
    try {
        await sequelize.authenticate();
        const results = { tables: {}, logs: [] };

        const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';", { type: QueryTypes.SELECT });
        const tableNames = tables.map(t => t.name);
        results.tableNames = tableNames;

        for (const tableName of tableNames) {
            try {
                const data = await sequelize.query(`SELECT * FROM ${tableName} LIMIT 10;`, { type: QueryTypes.SELECT });
                results.tables[tableName] = data;
            } catch (e) {
                results.logs.push(`Could not read ${tableName}: ${e.message}`);
            }
        }

        fs.writeFileSync('db_inspect_output.json', JSON.stringify(results, null, 2));
        console.log('Inspection completed. Results written to db_inspect_output.json');

    } catch (error) {
        console.error('Inspection failed:', error);
    } finally {
        await sequelize.close();
    }
}

inspectDB();
