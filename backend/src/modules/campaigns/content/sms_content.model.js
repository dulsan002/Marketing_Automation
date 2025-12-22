const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const SMSCampaignContent = sequelize.define('SMSCampaignContent', {
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
    message: {
        type: DataTypes.STRING(160), // Strict limit
        allowNull: false,
        validate: { notEmpty: true, len: [1, 160] }
    }
}, {
    timestamps: true,
    tableName: 'SMSCampaignContents'
});

module.exports = SMSCampaignContent;
