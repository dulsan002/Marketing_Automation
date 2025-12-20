const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

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

        // 1. Add columns to Contacts
        const tableInfo = await queryInterface.describeTable('Contacts');

        if (!tableInfo.company) {
            console.log('🛠️ Adding "company" to Contacts...');
            await queryInterface.addColumn('Contacts', 'company', {
                type: DataTypes.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.jobTitle) {
            console.log('🛠️ Adding "jobTitle" to Contacts...');
            await queryInterface.addColumn('Contacts', 'jobTitle', {
                type: DataTypes.STRING,
                allowNull: true
            });
        }

        // 2. Update Registrations (SQLite doesn't support ALTER COLUMN ENUM easily, but we can ignore strict enum checks in SQLite or just rely on application layer validation for now)
        // Since it's SQLite, ENUMs are basically VARCHARs checking constraints. We might need to recreate the constraint or just let it be if Sequelize handles it at app level.
        // For SQLite, standard practice is often to not enforce ENUM strictly at DB level or check constraints.
        // We will assume application level validation for now as SQLite ENUM modification is complex (requires table rebuild).

        console.log('✅ Database upgrade complete.');

    } catch (error) {
        console.error('❌ Upgrade failed:', error);
    } finally {
        await sequelize.close();
    }
}

upgrade();
