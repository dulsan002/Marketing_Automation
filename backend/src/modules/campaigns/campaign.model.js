const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Tenant = require('../tenants/tenant.model');

const Campaign = sequelize.define('Campaign', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Email', 'SMS', 'Social Post', 'In-app', 'Offline'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'ACTIVE', 'ARCHIVED'),
        defaultValue: 'DRAFT'
    },
    activeVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    segmentId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'Campaigns'
});

// Associations
Campaign.belongsTo(Tenant);
Tenant.hasMany(Campaign);

module.exports = Campaign;
