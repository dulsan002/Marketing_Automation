const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const InAppCampaignContent = sequelize.define('InAppCampaignContent', {
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
    headline: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    actionUrl: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'InAppCampaignContents'
});

module.exports = InAppCampaignContent;
