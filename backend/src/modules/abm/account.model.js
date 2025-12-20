const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Tenant = require('../auth/tenant.model');

const Account = sequelize.define('Account', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    domain: {
        type: DataTypes.STRING,
        allowNull: true
    },
    industry: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tier: {
        type: DataTypes.ENUM('Tier 1', 'Tier 2', 'Tier 3'),
        defaultValue: 'Tier 3'
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    },
    normalizedName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    intentScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    intentSignals: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    intentTrend: {
        type: DataTypes.ENUM('Increasing', 'Stable', 'Decreasing'),
        defaultValue: 'Stable'
    },
    intentSources: {
        type: DataTypes.JSON, // Stores array of strings e.g. ["LinkedIn", "Website"]
        defaultValue: []
    },
    revenue: {
        type: DataTypes.DECIMAL,
        allowNull: true
    },
    employees: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: true
});

Account.belongsTo(Tenant);
Tenant.hasMany(Account);

module.exports = Account;
