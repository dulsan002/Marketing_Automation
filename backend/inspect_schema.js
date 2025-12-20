const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.each("PRAGMA table_info(Tenants)", (err, row) => {
        if (err) console.error(err);
        console.log(row);
    });
});

db.close();
