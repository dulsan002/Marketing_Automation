const Campaign = require('./campaign.model');
const CampaignVersion = require('./campaign_version.model');
const { sequelize } = require('../../config/database');
const ActivityLogger = require('../system/activity_logger');

const validateContent = (type, content) => {
    if (!content) return;
    switch (type) {
        case 'Email':
            if (!content.subject) throw new Error('Email campaign requires a Subject');
            if (!content.body) throw new Error('Email campaign requires a Body');
            if (!content.senderName) throw new Error('Email campaign requires Sender Name');
            if (!content.senderEmail) throw new Error('Email campaign requires Sender Email');
            break;
        case 'SMS':
            if (!content.message) throw new Error('SMS campaign requires a Message');
            if (content.message.length > 160) throw new Error('SMS message exceeds 160 characters');
            break;
        case 'Social Post':
            if (!content.platform) throw new Error('Social campaign requires a Platform');
            if (!content.text) throw new Error('Social campaign requires Text');
            break;
        case 'In-app':
            if (!content.headline) throw new Error('In-app campaign requires a Headline');
            break;
        case 'Offline':
            if (!content.title) throw new Error('Offline campaign requires a Title');
            break;
        default:
            break;
    }
};

const createCampaign = async (campaignData) => {
    const { content, schedule, metrics, ...metadata } = campaignData;

    if (content) {
        validateContent(metadata.type, content);
    }

    const t = await sequelize.transaction();
    try {
        const campaign = await Campaign.create({ ...metadata, activeVersion: 1 }, { transaction: t });

        await CampaignVersion.create({
            campaignId: campaign.id,
            version: 1,
            content: content || {},
            schedule: schedule || {},
            metrics: metrics || { sent: 0, openRate: 0, ctr: 0 },
            isLocked: false
        }, { transaction: t });

        await t.commit();
        return await getCampaignById(campaign.id, metadata.TenantId);
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

const getCampaigns = async (tenantId) => {
    return await Campaign.findAll({
        where: { TenantId: tenantId },
        include: [{
            model: CampaignVersion,
            // We'll filter for active version manually or use a scope if needed
        }],
        order: [['updatedAt', 'DESC']]
    });
};

const getCampaignById = async (id, tenantId) => {
    const campaign = await Campaign.findOne({
        where: { id, TenantId: tenantId },
        include: [CampaignVersion]
    });
    if (!campaign) throw new Error('Campaign not found');

    // Attach "active" version data for convenience
    const active = campaign.CampaignVersions.find(v => v.version === campaign.activeVersion);
    const plain = campaign.get({ plain: true });
    return {
        ...plain,
        content: active?.content || {},
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

    // If campaign is Active, we only allow Status changes (e.g. Deactivate/Pause)
    // We strictly block content/schedule/metrics updates while Active
    if (campaign.status === 'ACTIVE') {
        const isStatusChange = updates.status && updates.status !== 'ACTIVE';
        if (!isStatusChange) {
            throw new Error('Cannot edit a campaign that is active. Please pause or deactivate it first.');
        }
        // If it IS a status change (e.g. to DRAFT), we allow it to proceed.
    }

    const { content, schedule, metrics, ...metadata } = updates;
    const activeVersion = await CampaignVersion.findOne({
        where: { campaignId: id, version: campaign.activeVersion }
    });

    const t = await sequelize.transaction();
    try {
        if (content) {
            const type = metadata.type || campaign.type;
            validateContent(type, content);
        }

        // Always update the current draft version (since we blocked active updates)
        await activeVersion.update({
            content: content || activeVersion.content,
            schedule: schedule || activeVersion.schedule,
            metrics: metrics || activeVersion.metrics
        }, { transaction: t });

        if (Object.keys(metadata).length > 0) {
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
        console.log(`[DEBUG_SERVICE] Activation Failed. Campaign Status: '${campaign.status}', ID: ${campaign.id}`);
        throw new Error(`Campaign is already active or in invalid state for activation. Current status: ${campaign.status}`);
    }

    const activeVersion = await CampaignVersion.findOne({
        where: { campaignId: id, version: campaign.activeVersion }
    });

    validateContent(campaign.type, activeVersion.content);

    const t = await sequelize.transaction();
    try {
        await activeVersion.update({ isLocked: true }, { transaction: t });
        await campaign.update({ status: 'ACTIVE' }, { transaction: t });
        await t.commit();

        // Log Activity
        await ActivityLogger.log(tenantId, null, 'Campaign', id, 'ACTIVATED', { version: activeVersion.version });

        // Publish Event
        const EventBus = require('../system/event_bus');
        await EventBus.publish('sys.campaign.lifecycle', {
            tenant_id: tenantId,
            event_type: 'ACTIVATED',
            entity_type: 'CAMPAIGN',
            entity_id: id,
            metadata: { version: activeVersion.version }
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

    const Workflow = require('../workflows/workflow.model');
    const activeWorkflows = await Workflow.findAll({
        where: { TenantId: tenantId, status: 'active' }
    });

    const isUsed = activeWorkflows.some(wf => {
        if (!wf.nodes || !Array.isArray(wf.nodes)) return false;
        return wf.nodes.some(node => node.data && node.data.campaignId === id);
    });

    if (isUsed) {
        throw new Error('Cannot archive a campaign that is used in an active workflow');
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
