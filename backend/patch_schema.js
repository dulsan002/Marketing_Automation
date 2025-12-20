const { sequelize } = require('./src/config/database');

async function patchSchema() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected. Patching...');

        // 1. Add 'domain' column
        try {
            await sequelize.query("ALTER TABLE `Accounts` ADD COLUMN `domain` VARCHAR(255);");
            console.log("Added 'domain' column.");
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log("'domain' column already exists.");
            } else {
                console.error("Error adding 'domain':", e.message);
            }
        }

        // 2. Add 'intentSources' column (JSON stored as TEXT in SQLite)
        try {
            await sequelize.query("ALTER TABLE `Accounts` ADD COLUMN `intentSources` TEXT;");
            console.log("Added 'intentSources' column.");
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log("'intentSources' column already exists.");
            } else {
                console.error("Error adding 'intentSources':", e.message);
            }
        }

    } catch (e) {
        console.error('Patch Error:', e);
    } finally {
        process.exit();
    }
}

patchSchema();
