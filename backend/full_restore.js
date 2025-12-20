const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/database');

const source = path.join(__dirname, 'database.sqlite');
const dest = path.join(__dirname, 'database_new.sqlite');

async function restoreAndUpgrade() {
    try {
        console.log('Starting restoration...');

        // 1. Delete destination if exists
        if (fs.existsSync(dest)) {
            console.log('Removing existing database_new.sqlite...');
            fs.unlinkSync(dest);
        }

        // 2. Copy source to destination
        console.log('Copying database.sqlite -> database_new.sqlite...');
        fs.copyFileSync(source, dest);
        console.log('Copy successful.');

        // 3. Upgrade Schema
        console.log('Connecting to upgraded database...');
        // Force new connection to avoid pool issues
        await sequelize.close();
        const { sequelize: newSeq } = require('./src/config/database');
        await newSeq.authenticate();

        console.log('Ensuring Events schema...');
        try {
            await newSeq.query("ALTER TABLE Events ADD COLUMN speaker TEXT;");
            console.log('Added speaker column.');
        } catch (e) {
            console.log('Speaker column exists or error:', e.message);
        }

        try {
            await newSeq.query("ALTER TABLE Events ADD COLUMN duration INTEGER DEFAULT 60;");
            console.log('Added duration column.');
        } catch (e) {
            console.log('Duration column exists or error:', e.message);
        }

        console.log('Restoration and Upgrade Complete!');

    } catch (e) {
        console.error('CRITICAL FAILURE:', e);
    }
}

restoreAndUpgrade();
