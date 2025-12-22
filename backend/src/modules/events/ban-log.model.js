const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Registration = require('./registration.model');

const BanLog = sequelize.define('BanLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    action: {
        type: DataTypes.ENUM('Banned', 'Unbanned'),
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bannedByName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bannedByEmail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    TenantId: { // Explicitly defining for clarity, though associations handle it usually
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    timestamps: true
});

BanLog.belongsTo(Registration);
Registration.hasMany(BanLog);

module.exports = BanLog;
