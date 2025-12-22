const segmentService = require('./segment.service');

const create = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const segment = await segmentService.createSegment({ ...req.body, TenantId: tenantId });
        res.status(201).json({ status: 'success', data: segment });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const segments = await segmentService.getSegments(tenantId);
        res.status(200).json({ status: 'success', data: segments });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getOne = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const segment = await segmentService.getSegmentById(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: segment });
    } catch (error) {
        if (error.message === 'Segment not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const segment = await segmentService.updateSegment(req.params.id, tenantId, req.body);
        res.status(200).json({ status: 'success', data: segment });
    } catch (error) {
        if (error.message === 'Segment not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        await segmentService.deleteSegment(req.params.id, tenantId);
        res.status(200).json({ status: 'success', message: 'Segment deleted' });
    } catch (error) {
        if (error.message === 'Segment not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const calculate = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const count = await segmentService.calculateMembers(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: { members: count } });
    } catch (error) {
        if (error.message === 'Segment not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const preview = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const { ruleGroups, matchType } = req.body;

        if (!Array.isArray(ruleGroups)) {
            return res.status(400).json({ status: 'error', message: 'ruleGroups must be an array' });
        }

        const { count, samples } = await segmentService.previewData(ruleGroups, matchType, tenantId);
        res.status(200).json({ status: 'success', data: { count, samples } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getOne,
    update,
    remove,
    calculate,
    preview
};
