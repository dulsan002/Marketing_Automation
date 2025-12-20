const { kafka } = require('../../../config/kafka');
const { redisClient } = require('../../../config/redis'); // Ensure Redis Client
const { publish } = require('../../system/event_bus');
const { evaluateContact } = require('./evaluator');
const Segment = require('../segment.model');
const SegmentMembership = require('../segment_membership.model');
const Contact = require('../../contacts/contact.model');
const { Op } = require('sequelize');

const TOPICS = ['sys.contact.update', 'map.email.opened', 'map.email.clicked', 'map.event.attended'];

const CONSUMER_GROUP = 'segment-engine-enterprise';

const startSegmentConsumer = async () => {
    const consumer = kafka.consumer({ groupId: CONSUMER_GROUP });

    try {
        await consumer.connect();
        console.log('✅ Enterprise Segment Engine Connected');

        await consumer.subscribe({ topics: TOPICS, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const prefix = `[Segment Engine] ${topic}:`;
                try {
                    const value = message.value.toString();
                    const eventData = JSON.parse(value);

                    // ID mapping
                    let contactId = eventData.contact_id || eventData.entity_id;
                    let tenantId = eventData.tenant_id;
                    let eventId = eventData.event_id || eventData.message_id || `${topic}-${contactId}-${Date.now()}`;

                    if (!contactId || !tenantId) return;

                    // 1. Idempotency Check (Redis)
                    // Key: segment:proc:{eventId}
                    const procKey = `segment:proc:${eventId}`;
                    const isNew = await redisClient.set(procKey, '1', {
                        NX: true,
                        EX: 3600 // 1 hour TTL
                    });

                    if (!isNew) {
                        console.log(`${prefix} Duplicate Event Ignored`);
                        return;
                    }

                    await evaluateSegmentsForContact(tenantId, contactId, topic);

                } catch (err) {
                    console.error(`${prefix} Error processing message`, err);
                }
            },
        });
    } catch (error) {
        console.error('❌ Segment Engine Consumer Failed:', error.message);
    }
};

const evaluateSegmentsForContact = async (tenantId, contactId, triggerSource) => {
    // 1. Fetch Contact
    const contact = await Contact.findOne({ where: { id: contactId, TenantId: tenantId } });
    if (!contact) return;

    // 2. Fetch Active Segments
    const segments = await Segment.findAll({ where: { TenantId: tenantId } });

    for (const segment of segments) {
        // 3. Evaluate (Async now)
        const isMatch = await evaluateContact(contact.toJSON(), segment.ruleGroups);

        // 4. Check Current Membership (Active Only)
        // We look for a record where exitedAt IS NULL
        const membership = await SegmentMembership.findOne({
            where: {
                SegmentId: segment.id,
                ContactId: contactId,
                exitedAt: null
            }
        });

        const now = new Date();

        if (isMatch && !membership) {
            // ENTER
            // Check if we have an old history record? 
            // We just create a new record for the new entry period.
            await SegmentMembership.create({
                SegmentId: segment.id,
                ContactId: contactId,
                metadata: { reason: `Triggered by ${triggerSource}` },
                enteredAt: now
            });

            console.log(`[Segment Engine] Contact ${contactId} ENTERED segment ${segment.name}`);

            // 5. Emit Event
            await publish('sys.segment.entry', {
                tenant_id: tenantId,
                event_type: 'SEGMENT_ENTERED', // Standardized Schema
                segment_id: segment.id,
                contact_id: contactId,
                timestamp: Math.floor(now.getTime() / 1000)
            });

        } else if (!isMatch && membership) {
            // EXIT
            // Soft delete: Update exitedAt
            await membership.update({ exitedAt: now });

            console.log(`[Segment Engine] Contact ${contactId} EXITED segment ${segment.name}`);

            await publish('sys.segment.exit', {
                tenant_id: tenantId,
                event_type: 'SEGMENT_EXITED', // Standardized Schema
                segment_id: segment.id,
                contact_id: contactId,
                timestamp: Math.floor(now.getTime() / 1000)
            });
        }
    }
};

module.exports = { startSegmentConsumer, evaluateSegmentsForContact };
