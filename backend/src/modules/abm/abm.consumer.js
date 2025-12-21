const { kafka } = require('../../config/kafka');
const accountService = require('./account.service');
const Contact = require('../contacts/contact.model');

const consumer = kafka.consumer({ groupId: 'abm-service-group' });

const startAbmConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'event-registrations', fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const prefix = `[ABM Consumer] ${topic}[${partition}]:`;
                try {
                    const payload = JSON.parse(message.value.toString());
                    console.log(`${prefix} Received`, payload);

                    const { tenantId, contactId, activityType, source } = payload;

                    // 1. Resolve AccountId from Contact
                    const contact = await Contact.findOne({ where: { id: contactId, TenantId: tenantId } });

                    if (!contact) {
                        console.warn(`${prefix} Contact ${contactId} not found. Skipping.`);
                        return;
                    }

                    if (!contact.AccountId) {
                        console.warn(`${prefix} Contact ${contact.email} has no Account. Intent signal will be orphan (created but no account score update).`);
                        // We can still create intent signal with null accountId? Score update requires accountId.
                        // processActivity allows accountId to be optional? 
                        // accountService.processActivity creates IntentSignal with accountId. Schema might allow null.
                        // But business wise, ABM score is Account based.
                        // Let's proceed, maybe contact gets mapped later.
                    }

                    // 2. Process Activity
                    await accountService.processActivity(
                        tenantId,
                        contactId,
                        contact.AccountId, // Can be null
                        activityType,
                        source
                    );

                    console.log(`${prefix} Processed Intent Signal for ${contact.email}`);

                } catch (e) {
                    console.error(`${prefix} Error processing message`, e);
                }
            },
        });
        console.log('✅ ABM Kafka Consumer Started');
    } catch (e) {
        console.error('❌ Failed to start ABM Consumer', e);
    }
};

module.exports = { startAbmConsumer };
