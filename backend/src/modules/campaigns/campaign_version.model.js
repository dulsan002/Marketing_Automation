const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Campaign = require('./campaign.model');

const CampaignVersion = sequelize.define('CampaignVersion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    campaignId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
    },
    schedule: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    metrics: {
        type: DataTypes.JSON,
        defaultValue: { sent: 0, openRate: 0, ctr: 0 }
    },
    isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    tableName: 'CampaignVersions',
    indexes: [
        {
            unique: true,
            fields: ['campaignId', 'version']
        }
    ]
});

CampaignVersion.belongsTo(Campaign, { foreignKey: 'campaignId' });
Campaign.hasMany(CampaignVersion, { foreignKey: 'campaignId' });

module.exports = CampaignVersion;
