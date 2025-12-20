const { sequelize } = require('./src/config/database');

async function safeUpgrade() {
    try {
        console.log('Connecting to existing database...');
        await sequelize.authenticate();

        console.log('Adding missing columns to Events table...');

        try {
            await sequelize.query('ALTER TABLE Events ADD COLUMN speaker TEXT;');
            console.log('Added speaker column.');
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log('Speaker column already exists.');
            } else {
                console.error('Error adding speaker:', e.message);
            }
        }

        try {
            await sequelize.query('ALTER TABLE Events ADD COLUMN duration INTEGER DEFAULT 60;');
            console.log('Added duration column.');
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log('Duration column already exists.');
            } else {
                console.error('Error adding duration:', e.message);
            }
        }

        console.log('Upgrade complete. Data preserved.');

    } catch (e) {
        console.error('Upgrade failed:', e);
    } finally {
        await sequelize.close();
    }
}

safeUpgrade();
