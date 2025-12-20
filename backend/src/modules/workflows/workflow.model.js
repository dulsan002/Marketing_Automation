const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Tenant = require('../tenants/tenant.model');

const Workflow = sequelize.define('Workflow', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('draft', 'active', 'paused', 'archived'),
        defaultValue: 'draft'
    },
    trigger: {
        type: DataTypes.JSON,
        allowNull: true
        // e.g. { type: 'segment_entry', segmentId: '...' } or { type: 'event_register', eventId: '...' }
    },
    nodes: {
        type: DataTypes.JSON,
        defaultValue: []
        // Array of flow nodes: { id, type, data: { campaignId, ... } }
    },
    edges: {
        type: DataTypes.JSON,
        defaultValue: []
        // Array of connections: { source, target }
    },
    version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    timestamps: true,
    hooks: {
        beforeUpdate: (workflow) => {
            workflow.version += 1;
        }
    }
});

Workflow.belongsTo(Tenant);
Tenant.hasMany(Workflow);

module.exports = Workflow;
