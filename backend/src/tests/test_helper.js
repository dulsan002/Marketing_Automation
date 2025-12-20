const { sequelize } = require('../config/database');

const syncDb = async () => {
    try {
        if (sequelize.getDialect() === 'sqlite') {
            await sequelize.query('PRAGMA foreign_keys = OFF');
        }
        await sequelize.sync({ force: true });
        if (sequelize.getDialect() === 'sqlite') {
            await sequelize.query('PRAGMA foreign_keys = ON');
        }
    } catch (e) {
        console.error('Test DB Sync Failed:', e);
        throw e;
    }
};

module.exports = { syncDb };
