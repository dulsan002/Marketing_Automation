const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const OfflineCampaignContent = sequelize.define('OfflineCampaignContent', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    campaignVersionId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'OfflineCampaignContents'
});

module.exports = OfflineCampaignContent;
