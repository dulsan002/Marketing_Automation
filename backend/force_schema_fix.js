const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Disable FKs
    db.run("PRAGMA foreign_keys = OFF;");

    // Drop tables
    const tables = ['Tenants', 'Users', 'Accounts', 'Contacts', 'Workflows', 'Segments', 'Events', 'Campaigns', 'CampaignVersions', 'IntentSignals'];

    tables.forEach(table => {
        db.run(`DROP TABLE IF EXISTS "${table}"`, (err) => {
            if (err) console.error(`Error dropping ${table}:`, err.message);
            else console.log(`Dropped ${table}`);
        });
    });
});

db.close(() => console.log('Done dropping tables.'));
