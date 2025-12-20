const workflowService = require('./workflow.service');

const create = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const workflow = await workflowService.createWorkflow({ ...req.body, TenantId: tenantId });
        res.status(201).json({ status: 'success', data: workflow });
    } catch (error) {
        if (error.message.includes('Cycle') || error.message.includes('Orphan') || error.message.includes('Trigger')) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const workflows = await workflowService.getWorkflows(tenantId);
        res.status(200).json({ status: 'success', data: workflows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getOne = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const workflow = await workflowService.getWorkflowById(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: workflow });
    } catch (error) {
        if (error.message === 'Workflow not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const workflow = await workflowService.updateWorkflow(req.params.id, tenantId, req.body);
        res.status(200).json({ status: 'success', data: workflow });
    } catch (error) {
        if (error.message === 'Workflow not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        await workflowService.deleteWorkflow(req.params.id, tenantId);
        res.status(200).json({ status: 'success', message: 'Workflow deleted' });
    } catch (error) {
        if (error.message === 'Workflow not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const executionService = require('./execution.service');

const execute = async (req, res) => {
    try {
        const tenantId = req.context.tenantId;
        if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant context missing' });

        const execution = await executionService.startExecution(req.params.id, tenantId);
        res.status(200).json({ status: 'success', data: execution });
    } catch (error) {
        if (error.message.includes('not active')) return res.status(400).json({ status: 'error', message: error.message });
        if (error.message === 'Workflow not found') return res.status(404).json({ status: 'error', message: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getOne,
    update,
    remove,
    execute
};
