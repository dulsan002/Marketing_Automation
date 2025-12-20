const Workflow = require('./workflow.model');
const WorkflowExecution = require('./workflow_execution.model');
const { sequelize } = require('../../config/database');
const { redisClient } = require('../../config/redis');
const { DELAY_KEY } = require('./scheduler/scheduler.service');

const EmailService = require('../providers/email/email.service');
const SmsService = require('../providers/sms/sms.service'); // Added SMS Service
const CampaignService = require('../campaigns/campaign.service');
const Contact = require('../contacts/contact.model');

// Refactored recursive processor
const runStep = async (nodeId, allNodes, allEdges, executionId, logs, context) => {
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return;

    const nodeType = node.type.toUpperCase();

    // Handle WAIT Node
    if (nodeType === 'WAIT') {
        const durationMinutes = node.data?.duration || 1;
        const resumeTime = Date.now() + (durationMinutes * 60 * 1000);

        console.log(`[Execution] Pausing flow at Node ${nodeId} for ${durationMinutes} mins`);

        const taskPayload = JSON.stringify({ executionId, nodeId, context });
        try {
            await redisClient.zAdd(DELAY_KEY, { score: resumeTime, value: taskPayload });
        } catch (e) {
            console.error('[DEBUG] Redis Error', e);
        }

        logs.push({
            timestamp: new Date(),
            nodeId: node.id,
            type: 'WAIT',
            message: `Workflow Paused. Resuming at ${new Date(resumeTime).toISOString()}`
        });

        return;
    }

    // Handle ACTION Node
    if (nodeType === 'ACTION' && node.data?.campaignId) {
        // IDEMPOTENCY CHECK
        const idempotencyKey = `exec:node:${executionId}:${nodeId}`;
        const alreadyProcessed = await redisClient.set(idempotencyKey, '1', { NX: true, EX: 86400 }); // 24h retention

        if (!alreadyProcessed) {
            console.log(`[Execution] Skipping duplicate node execution ${nodeId}`);
            logs.push({ timestamp: new Date(), message: 'Skipped Duplicate Execution' });
        } else {
            try {
                const campaignId = node.data.campaignId;
                logs.push({
                    timestamp: new Date(),
                    nodeId: node.id,
                    type: 'ACTION',
                    message: `Executing Campaign ${campaignId}`
                });

                // Fetch Campaign Content
                const campaign = await CampaignService.getCampaignById(campaignId, context.tenantId);
                const { subject, body } = campaign.content || {};

                // Identify Channel
                // Campaign Type is authoritative
                const channel = (campaign.type || 'Email').toUpperCase(); // 'EMAIL', 'SMS'

                if (context.contact) {
                    if (channel === 'EMAIL') {
                        if (subject && body) {
                            await EmailService.sendEmail(campaignId, context.contact, body, subject);
                            logs.push({ timestamp: new Date(), message: 'Email Sent Successfully' });
                        } else {
                            logs.push({ timestamp: new Date(), message: 'Skipped Email: Missing Body/Subject' });
                        }
                    } else if (channel === 'SMS') {
                        const message = campaign.content?.message || body; // Fallback
                        if (message) {
                            await SmsService.sendSms(campaignId, context.contact, message);
                            logs.push({ timestamp: new Date(), message: 'SMS Sent Successfully' });
                        } else {
                            logs.push({ timestamp: new Date(), message: 'Skipped SMS: Missing Message' });
                        }
                    } else {
                        logs.push({ timestamp: new Date(), message: `Unsupported Channel: ${channel}` });
                    }
                } else {
                    logs.push({ timestamp: new Date(), message: 'Skipped: Missing Content or Contact' });
                }

            } catch (err) {
                console.error('Action Failed:', err);
                logs.push({ timestamp: new Date(), message: `Action Failed: ${err.message}` });
            }
        }
    } else {
        // Log Generic/Other Steps
        logs.push({
            timestamp: new Date(),
            nodeId: node.id,
            type: node.type,
            message: `Visiting ${node.type}`
        });
    }

    // Determine Next
    const outgoing = allEdges.filter(e => e.source === node.id);
    if (outgoing.length === 0) return;

    for (const edge of outgoing) {
        await runStep(edge.target, allNodes, allEdges, executionId, logs, context);
    }
};

const startExecution = async (workflowId, tenantId, context = {}) => {
    const workflow = await Workflow.findOne({ where: { id: workflowId, TenantId: tenantId } });
    if (!workflow) throw new Error('Workflow not found');

    if (workflow.status !== 'active') {
        throw new Error('Cannot execute a workflow that is not active');
    }

    // Hydrate Contact if ID provided
    if (context.contactId && !context.contact) {
        context.contact = await Contact.findOne({ where: { id: context.contactId, TenantId: tenantId } });
        context.tenantId = tenantId; // ensure tenantId is in context
    }

    const t = await sequelize.transaction();
    try {
        const execution = await WorkflowExecution.create({
            WorkflowId: workflowId,
            TenantId: tenantId,
            status: 'RUNNING',
            logs: []
        }, { transaction: t });

        // Logic
        let nodes = workflow.nodes || [];
        if (typeof nodes === 'string') {
            try { nodes = JSON.parse(nodes); } catch (e) { console.error('JSON Parse Error', e); }
        }

        const edges = workflow.edges || [];
        const trigger = nodes.find(n => n.type === 'Trigger');

        if (!trigger) throw new Error('No trigger found in workflow');

        const logs = [];
        logs.push({ timestamp: new Date(), message: 'Execution Started' });

        // Run
        await runStep(trigger.id, nodes, edges, execution.id, logs, context);

        // Check if we hit a WAIT
        const isPaused = logs.some(l => l.message && l.message.includes('Paused'));
        const finalStatus = isPaused ? 'PAUSED' : 'COMPLETED';
        const finishedAt = isPaused ? null : new Date();

        if (!isPaused) {
            logs.push({ timestamp: new Date(), message: 'Execution Completed' });
        }

        await execution.update({
            status: finalStatus,
            logs: logs,
            finishedAt: finishedAt
        }, { transaction: t });

        await t.commit();
        return execution;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

const resumeExecution = async (executionId, nodeId, context = {}) => {
    console.log(`[Execution] Resuming execution ${executionId} from node ${nodeId}`);

    // 1. Fetch Execution & Workflow
    const execution = await WorkflowExecution.findByPk(executionId);
    if (!execution) throw new Error('Execution not found');

    const workflow = await Workflow.findByPk(execution.WorkflowId);
    if (!workflow) throw new Error('Workflow not found');

    if (context && context.contactId && !context.contact) {
        context.contact = await Contact.findOne({ where: { id: context.contactId } });
        context.tenantId = execution.TenantId;
    }

    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];
    const node = nodes.find(n => n.id === nodeId);
    if (!node) throw new Error('Node not found');

    // 2. Log Resumption
    const currentLogs = execution.logs || [];
    currentLogs.push({
        timestamp: new Date(),
        nodeId: nodeId,
        type: 'WAIT',
        message: 'Workflow Resumed'
    });

    // 3. Find Outgoing from the WAIT node
    const outgoing = edges.filter(e => e.source === nodeId);

    // 4. Continue Recursion
    for (const edge of outgoing) {
        await runStep(edge.target, nodes, edges, executionId, currentLogs, context);
    }

    // 5. Update Status
    const isPausedAgain = currentLogs[currentLogs.length - 1].message && currentLogs[currentLogs.length - 1].message.includes('Paused');
    const finalStatus = isPausedAgain ? 'PAUSED' : 'COMPLETED';
    const finishedAt = isPausedAgain ? null : new Date();

    if (!isPausedAgain) {
        currentLogs.push({ timestamp: new Date(), message: 'Execution Completed' });
    }

    await execution.update({
        status: finalStatus,
        logs: currentLogs,
        finishedAt: finishedAt
    });

    return execution;
};

module.exports = {
    startExecution,
    resumeExecution
};
