const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const WorkflowCampaignRef = sequelize.define('WorkflowCampaignRef', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    workflowId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    campaignVersionId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'WorkflowCampaignRefs'
});

module.exports = WorkflowCampaignRef;
