const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configuration
const dbPath = path.join(__dirname, '../../../../database_new.sqlite');
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

        if (!tableInfo.venue) {
            console.log('🛠️ Adding "venue" to Events...');
            await queryInterface.addColumn('Events', 'venue', {
                type: DataTypes.STRING,
                allowNull: true
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
