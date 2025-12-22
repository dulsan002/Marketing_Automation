const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const EmailCampaignContent = sequelize.define('EmailCampaignContent', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    campaignVersionId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true // One content per version
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    senderName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
    },
    senderEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true }
    }
}, {
    timestamps: true,
    tableName: 'EmailCampaignContents'
});

module.exports = EmailCampaignContent;
