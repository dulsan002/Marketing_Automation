const { sequelize } = require('./src/config/database');

const inspect = async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query('PRAGMA table_info(Registrations);');
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

inspect();
