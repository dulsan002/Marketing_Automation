const campaignService = require('./campaign.service');

const create = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const campaign = await campaignService.createCampaign({ ...req.body, TenantId: tenantId });
        res.status(201).json({ status: 'success', data: campaign });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const campaigns = await campaignService.getCampaigns(tenantId);
        res.status(200).json({ status: 'success', data: campaigns });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getOne = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const campaign = await campaignService.getCampaignById(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: campaign });
    } catch (error) {
        if (error.message === 'Campaign not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const campaign = await campaignService.updateCampaign(req.params.id, tenantId, req.body);
        res.status(200).json({ status: 'success', data: campaign });
    } catch (error) {
        if (error.message.includes('Cannot edit')) return res.status(400).json({ status: 'error', message: error.message });
        if (error.message === 'Campaign not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const activate = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const campaign = await campaignService.activateCampaign(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: campaign });
    } catch (error) {
        console.log(`[DEBUG] Activation Error: ${error.message}`);
        if (error.message.includes('invalid state')) return res.status(400).json({ status: 'error', message: error.message });
        if (error.message === 'Campaign not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const archive = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const campaign = await campaignService.archive(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: campaign });
    } catch (error) {
        if (error.message === 'Campaign not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getOne,
    update,
    activate,
    archive
};
