const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../backend/database.sqlite');
const db = new sqlite3.Database(dbPath);

const createTenantsTable = `
CREATE TABLE IF NOT EXISTS Tenants (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    subscriptionPlan VARCHAR(50) DEFAULT 'free',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.serialize(() => {
    // 1. Get data from tenants_backup
    db.all("SELECT * FROM tenants_backup", (err, rows) => {
        if (err) {
            console.error("Error reading backup:", err);
            return;
        }
        console.log(`Found ${rows.length} records in tenants_backup.`);
        if (rows.length > 0) {
            console.log("Sample row:", rows[0]);
        }

        // 2. Drop existing Tenants table
        db.run("DROP TABLE IF EXISTS Tenants", (err) => {
            if (err) console.error("Error dropping table:", err);
            else console.log("Dropped Tenants table.");

            // 3. Create new Tenants table
            db.run(createTenantsTable, (err) => {
                if (err) console.error("Error creating table:", err);
                else console.log("Created new Tenants table.");

                // 4. Insert data
                const stmt = db.prepare("INSERT INTO Tenants (id, name, domain, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
                let inserted = 0;
                rows.forEach(row => {
                    // Map fields dynamically based on possible backup column names
                    const id = row.id || row.tenant_id;
                    const name = row.name || row.tenant_name || 'Unknown Tenant';
                    const domain = row.domain || (name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
                    const status = row.status || 'ACTIVE';
                    const createdAt = row.created_at || row.createdAt || new Date();
                    const updatedAt = row.updated_at || row.updatedAt || new Date();

                    stmt.run(id, name, domain, status, createdAt, updatedAt, (err) => {
                        if (err) console.error("Insert error:", err);
                        else inserted++;
                    });
                });
                stmt.finalize(() => {
                    console.log(`Restoration complete. Inserted ${inserted} tenants.`);
                });
            });
        });
    });
});

db.close();
