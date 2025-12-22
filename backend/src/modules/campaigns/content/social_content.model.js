const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const SocialCampaignContent = sequelize.define('SocialCampaignContent', {
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
    platform: {
        type: DataTypes.ENUM('Facebook', 'LinkedIn', 'Twitter', 'Instagram'),
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isUrl: true }
    }
}, {
    timestamps: true,
    tableName: 'SocialCampaignContents'
});

module.exports = SocialCampaignContent;
