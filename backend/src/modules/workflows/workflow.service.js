const Workflow = require('./workflow.model');
const ActivityLogger = require('../system/activity_logger');

const validateGraph = (nodes, edges) => {
    if (!nodes || nodes.length === 0) return; // Allow empty draft? Or enforce? Let's allow empty for now, but if nodes exist...
    if (nodes.length === 0 && edges.length === 0) return;

    // 1. Trigger Count
    const triggers = nodes.filter(n => n.type === 'Trigger');
    if (triggers.length !== 1) {
        throw new Error('Workflow must have exactly one Trigger node');
    }

    // 2. Orphan Check (Every node except Trigger must be a target of some edge)
    // Note: This is a simple check. unreachable parts of graph.
    const triggerId = triggers[0].id;
    const targets = new Set(edges.map(e => e.target));
    const orphans = nodes.filter(n => n.id !== triggerId && !targets.has(n.id));
    if (orphans.length > 0) {
        throw new Error(`Orphan nodes detected: ${orphans.map(n => n.id).join(', ')}`);
    }

    // 3. Cycle Detection (DFS)
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
        if (adj[e.source]) adj[e.source].push(e.target);
    });

    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (nodeId) => {
        if (recStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recStack.add(nodeId);

        const children = adj[nodeId] || [];
        for (const child of children) {
            if (hasCycle(child)) return true;
        }

        recStack.delete(nodeId);
        return false;
    };

    for (const node of nodes) {
        if (hasCycle(node.id)) {
            throw new Error(`Cycle detected involving node ${node.id}`);
        }
    }
};

const createWorkflow = async (data) => {
    if (data.nodes || data.edges) {
        validateGraph(data.nodes || [], data.edges || []);
    }
    return await Workflow.create(data);
};

const getWorkflows = async (tenantId) => {
    return await Workflow.findAll({ where: { TenantId: tenantId }, order: [['updatedAt', 'DESC']] });
};

const getWorkflowById = async (id, tenantId) => {
    const workflow = await Workflow.findOne({ where: { id, TenantId: tenantId } });
    if (!workflow) throw new Error('Workflow not found');
    return workflow;
};

const updateWorkflow = async (id, tenantId, updates) => {
    const workflow = await getWorkflowById(id, tenantId);

    // Validate Graph if structure changes
    if (updates.nodes || updates.edges) {
        const nodes = updates.nodes || workflow.nodes;
        const edges = updates.edges || workflow.edges;
        validateGraph(nodes, edges);
    }

    if (updates.status === 'active' && workflow.status === 'draft') {
        const nodes = updates.nodes || workflow.nodes || [];
        const edges = updates.edges || workflow.edges || [];

        // Strict Graph Validation on Activation (Redundant if we validate on save, but good for safety)
        validateGraph(nodes, edges);

        const Campaign = require('../campaigns/campaign.model');
        const CampaignVersion = require('../campaigns/campaign_version.model');
        const WorkflowCampaignRef = require('./workflow_campaign_ref.model');
        const { sequelize } = require('../../config/database');

        const t = await sequelize.transaction();
        try {
            for (const node of nodes) {
                if (node.data && node.data.campaignId) {
                    const campaign = await Campaign.findOne({
                        where: { id: node.data.campaignId, TenantId: tenantId },
                        transaction: t
                    });

                    if (!campaign) throw new Error(`Referenced campaign ${node.data.campaignId} not found`);
                    if (campaign.status !== 'ACTIVE') {
                        throw new Error(`Cannot activate workflow: Referenced campaign '${campaign.name}' is not ACTIVE. Current status: ${campaign.status}`);
                    }

                    // Get the active version record
                    const activeVersion = await CampaignVersion.findOne({
                        where: { campaignId: campaign.id, version: campaign.activeVersion },
                        transaction: t
                    });

                    // Lock it
                    await activeVersion.update({ isLocked: true }, { transaction: t });

                    // Record reference
                    await WorkflowCampaignRef.create({
                        workflowId: workflow.id,
                        campaignVersionId: activeVersion.id,
                        tenantId: tenantId
                    }, { transaction: t });
                }
            }
            // Update the workflow with new status (and potentially nodes/edges if passed)
            await workflow.update(updates, { transaction: t });
            await t.commit();

            // Log Activity
            await ActivityLogger.log(tenantId, null, 'Workflow', id, 'ACTIVATED', { nodes: nodes.length });

            return workflow; // Return updated instance
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    return await workflow.update(updates);
};

const deleteWorkflow = async (id, tenantId) => {
    const workflow = await getWorkflowById(id, tenantId);
    return await workflow.destroy();
};

module.exports = {
    createWorkflow,
    getWorkflows,
    getWorkflowById,
    updateWorkflow,
    deleteWorkflow
};
