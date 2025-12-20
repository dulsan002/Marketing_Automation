const { redisClient } = require('../../../config/redis');
const { publish } = require('../../system/event_bus');

const DELAY_KEY = 'scheduler:workflow:delays';
const POLL_INTERVAL_MS = 3000;
let pollTimer = null;

const startScheduler = () => {
    if (pollTimer) return;
    console.log('✅ Workflow Scheduler Started');
    poll();
};

const poll = async () => {
    try {
        const now = Date.now();
        // ZRANGEBYSCORE key -inf current_timestamp
        // Limit to 10-50 items to avoid blocking big batches
        // redis v4: zRangeByScore is getting deprecated for zRange with options, but sticking to basics or raw commands if needed.
        // Node redis client v4 structure: await client.zRangeByScore(key, min, max);

        // Using generic ZRANGE with BYSCORE argument since Node Redis v4
        const dueTasks = await redisClient.zRange(DELAY_KEY, '-inf', now.toString(), {
            BY: 'SCORE'
        });

        if (dueTasks && dueTasks.length > 0) {
            console.log(`[Scheduler] Found ${dueTasks.length} due tasks`);

            for (const taskJson of dueTasks) {
                const task = JSON.parse(taskJson);

                // Publish Resume Command
                await publish('cmd.workflow.resume', {
                    event_type: 'RESUME_WORKFLOW',
                    execution_id: task.executionId,
                    node_id: task.nodeId,
                    context: task.context // Pass context through
                });

                // Remove from Set
                await redisClient.zRem(DELAY_KEY, taskJson);
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error polling:', error.message);
    }

    pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
};

// For testing
const stopScheduler = () => {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = null;
};

module.exports = { startScheduler, stopScheduler, DELAY_KEY };
