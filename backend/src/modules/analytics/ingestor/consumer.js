const { kafka } = require('../../../config/kafka');
const { handleCampaignLifecycle, handleEmailEvent } = require('./event_handlers');

// Topics to subscribe to
const TOPICS = ['sys.campaign.lifecycle', 'map.email.events'];

const consumer = kafka.producer ? kafka.consumer({ groupId: 'analytics-group' }) : null; // Handle mock structure

/* 
 * NOTE: verify_infra logic or environment check should guard this.
 * If kafka is mocked, kafka.consumer() might need to be mocked too.
 * Our current mock only returns { producer: ... }.
 * We need to update mock or handle basic check.
 */

const startConsumer = async () => {
    if (!consumer) {
        console.warn('Kafka Consumer not initialized (Mock Mode?)');
        return;
    }

    try {
        await consumer.connect();
        console.log('✅ Analytics Consumer Connected');

        await consumer.subscribe({ topics: TOPICS, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const prefix = `[Analytics Consumer] ${topic}:`;
                try {
                    const value = message.value.toString();
                    const eventData = JSON.parse(value);

                    // Route
                    switch (topic) {
                        case 'sys.campaign.lifecycle':
                            handleCampaignLifecycle(null, eventData);
                            break;
                        case 'map.email.events':
                            handleEmailEvent(null, eventData);
                            break;
                        default:
                            console.log(`${prefix} Ignored topic`);
                    }
                } catch (err) {
                    console.error(`${prefix} Error processing message`, err);
                }
            },
        });
    } catch (error) {
        console.error('❌ Analytics Consumer Failed:', error.message);
    }
};

module.exports = { startConsumer };
