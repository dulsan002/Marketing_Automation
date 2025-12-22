const { sequelize } = require('./src/config/database');

const fixDates = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Update 0 or numeric dates to current time
        // Method 1: Update where createdAt is '0' or 0
        const now = new Date().toISOString(); // '2025-12-21T...'

        // SQLite stores as Text usually. If Number, it might be matched by integer query.

        // Let's use raw query to be safe
        await sequelize.query(`UPDATE Accounts SET createdAt = '${now}' WHERE createdAt = 0 OR createdAt = '0'`);
        await sequelize.query(`UPDATE Accounts SET updatedAt = '${now}' WHERE updatedAt = 0 OR updatedAt = '0'`);

        console.log('Fixed numeric dates.');

    } catch (error) {
        console.error('FIX FAIL:', error);
    } finally {
        process.exit();
    }
};

fixDates();
