const { kafka } = require('../../../config/kafka');
const { startExecution } = require('../execution.service');
const Workflow = require('../workflow.model');
const { Op } = require('sequelize');

const TOPICS = ['sys.segment.entry'];

const initTriggerListener = async () => {
    const consumer = kafka.consumer({ groupId: 'workflow-trigger-group' });

    try {
        await consumer.connect();
        console.log('✅ Workflow Trigger Listener Connected');

        await consumer.subscribe({ topics: TOPICS, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const prefix = `[Trigger Listener] ${topic}:`;
                try {
                    const value = message.value.toString();
                    const eventData = JSON.parse(value);
                    const { event_type, segment_id, contact_id, tenant_id } = eventData;

                    if (event_type === 'SEGMENT_ENTERED' || event_type === 'SEGMENT_ENTRY') {
                        await handleSegmentEntry(tenant_id, segment_id, contact_id);
                    }

                } catch (err) {
                    console.error(`${prefix} Error processing message`, err);
                }
            },
        });
    } catch (error) {
        console.error('❌ Trigger Listener Failed:', error.message);
    }
};

const handleSegmentEntry = async (tenantId, segmentId, contactId) => {
    console.log(`[Trigger] Checking workflows for Segment Entry ${segmentId}`);

    // Find active workflows triggered by this segment
    // Note: 'trigger' is JSON column. In SQLite/Postgres generic usage:
    // We fetch all active and filter in memory for MVP safety/speed.
    const workflows = await Workflow.findAll({
        where: {
            TenantId: tenantId,
            status: 'active'
        }
    });

    const matching = workflows.filter(wf => {
        return wf.trigger &&
            wf.trigger.type === 'segment_entry' &&
            wf.trigger.segmentId === segmentId;
    });

    if (matching.length === 0) return;

    console.log(`[Trigger] Spawning ${matching.length} workflows for Contact ${contactId}`);

    for (const wf of matching) {
        // Start Execution
        // Pass Context with Contact ID
        await startExecution(wf.id, tenantId, { contactId });
    }
};

module.exports = { initTriggerListener };

