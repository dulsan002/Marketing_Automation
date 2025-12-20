const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: console.log, // Set to console.log to see SQL queries
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
