const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Campaign = require('./campaign.model');

// Import Content Models
const EmailCampaignContent = require('./content/email_content.model');
const SMSCampaignContent = require('./content/sms_content.model');
const SocialCampaignContent = require('./content/social_content.model');
const InAppCampaignContent = require('./content/in_app_content.model');
const OfflineCampaignContent = require('./content/offline_content.model');

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
    // content JSON field REMOVED in favor of explicit tables
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

// Associations
CampaignVersion.belongsTo(Campaign, { foreignKey: 'campaignId' });
Campaign.hasMany(CampaignVersion, { foreignKey: 'campaignId' });

// Content Associations
CampaignVersion.hasOne(EmailCampaignContent, { foreignKey: 'campaignVersionId', as: 'emailContent' });
EmailCampaignContent.belongsTo(CampaignVersion, { foreignKey: 'campaignVersionId' });

CampaignVersion.hasOne(SMSCampaignContent, { foreignKey: 'campaignVersionId', as: 'smsContent' });
SMSCampaignContent.belongsTo(CampaignVersion, { foreignKey: 'campaignVersionId' });

CampaignVersion.hasOne(SocialCampaignContent, { foreignKey: 'campaignVersionId', as: 'socialContent' });
SocialCampaignContent.belongsTo(CampaignVersion, { foreignKey: 'campaignVersionId' });

CampaignVersion.hasOne(InAppCampaignContent, { foreignKey: 'campaignVersionId', as: 'inAppContent' });
InAppCampaignContent.belongsTo(CampaignVersion, { foreignKey: 'campaignVersionId' });

CampaignVersion.hasOne(OfflineCampaignContent, { foreignKey: 'campaignVersionId', as: 'offlineContent' });
OfflineCampaignContent.belongsTo(CampaignVersion, { foreignKey: 'campaignVersionId' });

module.exports = CampaignVersion;
