const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Tenant = require('../tenants/tenant.model');

const ActivityLog = sequelize.define('ActivityLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // tenantId via association
    actorId: {
        type: DataTypes.UUID,
        allowNull: true // Null means System
    },
    entityType: {
        type: DataTypes.STRING,
        allowNull: false
        // 'Campaign', 'Workflow', 'Account', etc.
    },
    entityId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
        // 'CREATED', 'ACTIVATED', 'ARCHIVED', etc.
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    timestamps: true,
    tableName: 'ActivityLogs'
});

ActivityLog.belongsTo(Tenant);
Tenant.hasMany(ActivityLog);

module.exports = ActivityLog;
