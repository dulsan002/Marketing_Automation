const { sequelize } = require('./src/config/database');

async function addBanReason() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Check dialect to use correct ALTER syntax (SQLite vs others)
        const dialect = sequelize.getDialect();
        console.log(`Dialect: ${dialect}`);

        // Add banReason column
        await sequelize.getQueryInterface().addColumn('Registrations', 'banReason', {
            type: require('sequelize').DataTypes.TEXT,
            allowNull: true
        });

        console.log('✅ Added banReason column to Registrations table');

    } catch (e) {
        if (e.message && e.message.includes('duplicate column name')) {
            console.log('⚠️ Column banReason already exists');
        } else {
            console.error('❌ Failed to add column:', e);
        }
    }
}

addBanReason();
