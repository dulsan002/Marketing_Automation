const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const dbPath = path.join(__dirname, '../../database_new.sqlite');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: console.log
});

async function upgrade() {
    try {
        console.log('🔌 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('Events');

        if (!tableInfo.collectCompany) {
            console.log('🛠️ Adding "collectCompany"...');
            await queryInterface.addColumn('Events', 'collectCompany', {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            });
        }

        if (!tableInfo.collectJobTitle) {
            console.log('🛠️ Adding "collectJobTitle"...');
            await queryInterface.addColumn('Events', 'collectJobTitle', {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            });
        }

        console.log('✅ Event Schema upgrade complete.');

    } catch (error) {
        console.error('❌ Upgrade failed:', error);
    } finally {
        await sequelize.close();
    }
}

upgrade();
