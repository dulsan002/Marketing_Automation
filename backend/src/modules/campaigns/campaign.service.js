const Campaign = require('./campaign.model');
const CampaignVersion = require('./campaign_version.model');
const { sequelize } = require('../../config/database');
const ActivityLogger = require('../system/activity_logger');
const Tenant = require('../tenants/tenant.model');

// Import Content Models
const EmailCampaignContent = require('./content/email_content.model');
const SMSCampaignContent = require('./content/sms_content.model');
const SocialCampaignContent = require('./content/social_content.model');
const InAppCampaignContent = require('./content/in_app_content.model');
const OfflineCampaignContent = require('./content/offline_content.model');

const getContentModel = (type) => {
    switch (type) {
        case 'Email': return { model: EmailCampaignContent, as: 'emailContent' };
        case 'SMS': return { model: SMSCampaignContent, as: 'smsContent' };
        case 'Social Post': return { model: SocialCampaignContent, as: 'socialContent' };
        case 'In-app': return { model: InAppCampaignContent, as: 'inAppContent' };
        case 'Offline': return { model: OfflineCampaignContent, as: 'offlineContent' };
        default: return null;
    }
};

const validateContent = (type, content) => {
    if (!content) return;
    // Basic validation, strict validation happens at DB level
    switch (type) {
        case 'Email':
            if (!content.subject) throw new Error('Email campaign requires a Subject');
            if (!content.body) throw new Error('Email campaign requires a Body');
            break;
        case 'SMS':
            if (!content.message) throw new Error('SMS campaign requires a Message');
            break;
        // ... add others as needed
    }
};

const createCampaign = async (campaignData) => {
    const { content, schedule, metrics, ...metadata } = campaignData;
    // Explicitly set status to DRAFT
    metadata.status = 'DRAFT';

    if (content) {
        validateContent(metadata.type, content);
    }

    let campaign;
    const t = await sequelize.transaction();
    try {
        campaign = await Campaign.create({ ...metadata, activeVersion: 1 }, { transaction: t });

        const version = await CampaignVersion.create({
            campaignId: campaign.id,
            version: 1,
            schedule: schedule || {},
            metrics: metrics || { sent: 0, openRate: 0, ctr: 0 },
            isLocked: false
        }, { transaction: t });

        // Create specific content
        const contentConfig = getContentModel(metadata.type);
        if (contentConfig && content) {
            await contentConfig.model.create({
                ...content,
                campaignVersionId: version.id
            }, { transaction: t });
        }

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }

    return await getCampaignById(campaign.id, metadata.TenantId);
};


const getCampaigns = async (tenantId) => {
    return await Campaign.findAll({
        where: { TenantId: tenantId },
        include: [{
            model: CampaignVersion,
            attributes: ['id', 'version', 'updatedAt']
        }],
        order: [['updatedAt', 'DESC']]
    });
};

const getCampaignById = async (id, tenantId) => {
    const campaign = await Campaign.findOne({
        where: { id, TenantId: tenantId },
        include: [
            {
                model: CampaignVersion,
                include: [
                    { model: EmailCampaignContent, as: 'emailContent' },
                    { model: SMSCampaignContent, as: 'smsContent' },
                    { model: SocialCampaignContent, as: 'socialContent' },
                    { model: InAppCampaignContent, as: 'inAppContent' },
                    { model: OfflineCampaignContent, as: 'offlineContent' }
                ]
            }
        ]
    });
    if (!campaign) throw new Error('Campaign not found');

    // Attach "active" version data for convenience (or latest draft if in draft mode)
    // For DRAFT campaigns, activeVersion points to the current draft being worked on.
    const active = campaign.CampaignVersions.find(v => v.version === campaign.activeVersion);

    // Resolve content based on type
    let content = {};
    if (active) {
        if (campaign.type === 'Email') content = active.emailContent;
        else if (campaign.type === 'SMS') content = active.smsContent;
        else if (campaign.type === 'Social Post') content = active.socialContent;
        else if (campaign.type === 'In-app') content = active.inAppContent;
        else if (campaign.type === 'Offline') content = active.offlineContent;
    }

    const plain = campaign.get({ plain: true });
    const contentData = content ? content.get({ plain: true }) : {};

    // Remove metadata from content object to avoid collisions if any
    delete contentData.id;
    delete contentData.createdAt;
    delete contentData.updatedAt;
    delete contentData.campaignVersionId;

    return {
        ...plain,
        ...contentData, // Flattened content
        schedule: active?.schedule || {},
        metrics: active?.metrics || {},
        isLocked: active?.isLocked || false
    };
};

const updateCampaign = async (id, tenantId, updates) => {
    const campaign = await Campaign.findOne({ where: { id, TenantId: tenantId } });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status === 'ARCHIVED') {
        throw new Error('Cannot edit a campaign that is archived');
    }

    if (campaign.status === 'ACTIVE') {
        const isStatusChange = updates.status && updates.status !== 'ACTIVE';
        if (!isStatusChange) {
            throw new Error('Cannot edit a campaign that is active. Please pause or deactivate it first.');
        }
    }

    const { content, schedule, metrics, ...metadata } = updates;
    const activeVersion = await CampaignVersion.findOne({
        where: { campaignId: id, version: campaign.activeVersion }
    });

    const t = await sequelize.transaction();
    try {
        if (content) {
            const type = metadata.type || campaign.type;
            // validateContent(type, content);

            const contentConfig = getContentModel(type);
            if (contentConfig) {
                // Upsert content
                const existingContent = await contentConfig.model.findOne({
                    where: { campaignVersionId: activeVersion.id },
                    transaction: t
                });

                if (existingContent) {
                    await existingContent.update(content, { transaction: t });
                } else {
                    await contentConfig.model.create({
                        ...content,
                        campaignVersionId: activeVersion.id
                    }, { transaction: t });
                }
            }
        }

        await activeVersion.update({
            schedule: schedule || activeVersion.schedule,
            metrics: metrics || activeVersion.metrics
        }, { transaction: t });

        if (Object.keys(metadata).length > 0) {
            // Protect immutable fields
            delete metadata.id;
            delete metadata.TenantId;
            delete metadata.type; // Type cannot be changed after creation usually
            await campaign.update(metadata, { transaction: t });
        }

        await t.commit();
        return await getCampaignById(id, tenantId);
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

const activateCampaign = async (id, tenantId) => {
    const campaign = await Campaign.findOne({ where: { id, TenantId: tenantId } });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'DRAFT') {
        throw new Error(`Campaign is already active or in invalid state for activation. Current status: ${campaign.status}`);
    }

    if (!campaign.segmentId) {
        throw new Error('Cannot activate a campaign without a target segment.');
    }

    // Verify Segment exists and has members
    // We assume Segment model exists in 'segments/segment.model'
    // This requires a cross-module check. For now we assume FK integrity logic or direct check.
    const Segment = require('../segments/segment.model');
    const segment = await Segment.findOne({ where: { id: campaign.segmentId } });
    if (!segment) throw new Error('Target segment not found.');
    if (segment.members === 0) throw new Error('Cannot activate campaign: Segment has no members.');

    const activeVersion = await CampaignVersion.findOne({
        where: { campaignId: id, version: campaign.activeVersion }
    });

    // Final Content Validation
    const contentConfig = getContentModel(campaign.type);
    const content = await contentConfig.model.findOne({ where: { campaignVersionId: activeVersion.id } });
    if (!content) throw new Error('Cannot activate campaign: Content is missing.');

    // Strict Schema Validation happens transparently due to DB constraints, but we can double check specifics here if needed.

    const t = await sequelize.transaction();
    try {
        await activeVersion.update({ isLocked: true }, { transaction: t });
        await campaign.update({ status: 'ACTIVE' }, { transaction: t });
        await t.commit();

        // Log Activity
        await ActivityLogger.log(tenantId, null, 'Campaign', id, 'ACTIVATED', { version: activeVersion.version });

        // Publish Event (Placeholder for Kafka)
        const EventBus = require('../system/event_bus');
        await EventBus.publish('sys.campaign.lifecycle', {
            tenant_id: tenantId,
            event_type: 'ACTIVATED',
            entity_type: 'CAMPAIGN',
            entity_id: id,
            metadata: { version: activeVersion.version, segmentId: campaign.segmentId }
        });

        return await getCampaignById(id, tenantId);
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

const archive = async (id, tenantId) => {
    const campaign = await Campaign.findOne({ where: { id, TenantId: tenantId } });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status === 'ACTIVE') {
        // Check workflow usage
        const Workflow = require('../workflows/workflow.model');
        const activeWorkflows = await Workflow.findAll({
            where: { TenantId: tenantId, status: 'active' }
        });

        const isUsed = activeWorkflows.some(wf => {
            if (!wf.nodes || !Array.isArray(wf.nodes)) return false;
            // Enhanced check: Handle both direct campaignId or data.campaignId
            return wf.nodes.some(node =>
                (node.data && node.data.campaignId === id) ||
                (node.settings && node.settings.campaignId === id)
            );
        });

        if (isUsed) {
            throw new Error('Cannot archive a campaign that is used in an active workflow');
        }
    }

    const result = await campaign.update({ status: 'ARCHIVED' });

    // Log Activity
    await ActivityLogger.log(tenantId, null, 'Campaign', id, 'ARCHIVED');

    return result;
}

module.exports = {
    createCampaign,
    getCampaigns,
    getCampaignById,
    updateCampaign,
    activateCampaign,
    archive
};
