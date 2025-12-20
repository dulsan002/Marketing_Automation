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
        const tableInfo = await queryInterface.describeTable('Contacts');

        if (!tableInfo.company) {
            console.log('🛠️ Adding "company"...');
            await queryInterface.addColumn('Contacts', 'company', {
                type: DataTypes.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.jobTitle) {
            console.log('🛠️ Adding "jobTitle"...');
            await queryInterface.addColumn('Contacts', 'jobTitle', {
                type: DataTypes.STRING,
                allowNull: true
            });
        }

        console.log('✅ Contact Schema upgrade complete.');

    } catch (error) {
        console.error('❌ Upgrade failed:', error);
    } finally {
        await sequelize.close();
    }
}

upgrade();
