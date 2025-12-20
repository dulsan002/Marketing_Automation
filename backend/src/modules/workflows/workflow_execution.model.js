const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Workflow = require('./workflow.model');
const Tenant = require('../tenants/tenant.model');

const WorkflowExecution = sequelize.define('WorkflowExecution', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING'
    },
    currentStepId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    logs: {
        type: DataTypes.JSON,
        defaultValue: []
        // Array of objects: { timestamp, nodeId, action, message }
    },
    startedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    finishedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'WorkflowExecutions'
});

// Associations
WorkflowExecution.belongsTo(Workflow);
Workflow.hasMany(WorkflowExecution);

WorkflowExecution.belongsTo(Tenant);
Tenant.hasMany(WorkflowExecution);

module.exports = WorkflowExecution;
