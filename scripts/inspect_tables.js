const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../backend/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- Tenants Table Schema ---");
    db.all("PRAGMA table_info(tenants)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log("\n--- Tenants Backup Table Schema ---");
    db.all("PRAGMA table_info(tenants_backup)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log("\n--- Users Table Schema ---");
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });
});

db.close();
