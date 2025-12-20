const { kafka } = require('../../../config/kafka');
const { resumeExecution } = require('../execution.service');

const TOPIC = 'cmd.workflow.resume';

/*
 * NOTE: verify_infra logic or environment check should guard this.
 */

const startResumeConsumer = async () => {
    const consumer = kafka.consumer({ groupId: 'workflow-resume-group' });

    try {
        await consumer.connect();
        console.log('✅ Workflow Resume Consumer Connected');

        await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const prefix = `[Resume Consumer] ${topic}:`;
                try {
                    const value = message.value.toString();
                    const data = JSON.parse(value);

                    if (data.event_type === 'RESUME_WORKFLOW') {
                        console.log(`${prefix} Resuming Exec ${data.execution_id} Node ${data.node_id}`);
                        // Scheduler Service publishes just { execution_id, node_id } currently?
                        // Wait, execution.service writes 'context' to Redis Payload.
                        // Scheduler Service reads Payload and publishes it all in 'cmd.workflow.resume'?
                        // Let's check Scheduler Service.

                        // Assuming Scheduler passes through the 'value' payload or we updated Scheduler to do so.
                        // Currently Scheduler parses 'value' (which has context) and publishes it.
                        // So 'data' has 'context'.

                        await resumeExecution(data.execution_id, data.node_id, data.context);
                    }
                } catch (err) {
                    console.error(`${prefix} Error processing message`, err);
                }
            },
        });
    } catch (error) {
        console.error('❌ Resume Consumer Failed:', error.message);
    }
};

module.exports = { startResumeConsumer };
