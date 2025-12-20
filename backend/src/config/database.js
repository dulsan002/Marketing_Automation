const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database_new.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false, // Reduce noise
    retry: {
        match: [/SQLITE_BUSY/],
        max: 3
    },
    pool: {
        max: 1, // Strict serialization to fix SQLITE_BUSY on Windows
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    dialectOptions: {
        busyTimeout: 10000 // Wait 10s
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Enable WAL mode safely after connection
        try {
            await sequelize.query('PRAGMA journal_mode = WAL;');
            await sequelize.query('PRAGMA synchronous = NORMAL;'); // Less locking
            console.log('Database switched to WAL mode');
        } catch (walErr) {
            console.warn('Could not enable WAL mode:', walErr.message);
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
