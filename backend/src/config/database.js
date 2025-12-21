const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.join(__dirname, '../../database_new.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false, // Reduce noise
    retry: {
        match: [/SQLITE_BUSY/],
        max: 3
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        busyTimeout: 10000 // Wait 10s
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Enable WAL mode for better concurrency
        try {
            await sequelize.query('PRAGMA journal_mode = WAL;');
        } catch (walErr) {
            console.warn('Could not enable WAL mode:', walErr.message);
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
