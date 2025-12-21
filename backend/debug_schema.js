const { Sequelize } = require('sequelize');
const { connectDB } = require('./src/config/database');

// Helper to inspect table schema
async function checkSchema() {
    await connectDB();
    const sequelize = require('./src/config/database').sequelize;

    try {
        const tables = await sequelize.getQueryInterface().showAllSchemas(); // SQLite might behave differently
        // For SQLite, query sqlite_master
        const [results, metadata] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
        console.log('Tables:', results.map(r => r.name));

        // Check Contact Columns
        const [contactCols] = await sequelize.query("PRAGMA table_info(Contacts);");
        console.log('Contact Columns:', contactCols.map(c => c.name));

        // Check Segment Columns (if exists)
        const [segmentCols] = await sequelize.query("PRAGMA table_info(Segments);");
        if (segmentCols.length) {
            console.log('Segment Columns:', segmentCols.map(c => c.name));
        } else {
            console.log('Segments table not found.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkSchema();
