const { producer } = require('../../config/kafka');

const publish = async (topic, event) => {
    try {
        // Enforce standard header
        const message = {
            value: JSON.stringify({
                ...event,
                timestamp: new Date().toISOString(),
                // Add traceId/correlationId here if request context is available
            })
        };

        // If producer is not connected (e.g. no docker), just log in dev
        // In prod, this would likely throw or buffer.
        // Check if producer is ready? KafkaJS producer handles buffering/retries automatically if connected.
        // If never connected, send might fail.

        // For this phase where docker might be missing, we catch errors.
        await producer.send({
            topic,
            messages: [message],
        });

        if (process.env.NODE_ENV !== 'test') {
            console.log(`[EventBus] Published to ${topic}:`, event.event || 'Unknown Event');
        }
    } catch (error) {
        console.error(`[EventBus] Failed to publish to ${topic}:`, error.message);
        // Fallback or Alerting
    }
};

module.exports = { publish };
