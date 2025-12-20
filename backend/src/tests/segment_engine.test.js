const { evaluateSegmentsForContact } = require('../modules/segments/engine/consumer');
const { startTriggerListener } = require('../modules/workflows/engine/trigger.listener'); // We might mock this logic or call handler directly
const { startExecution } = require('../modules/workflows/execution.service');
const Contact = require('../modules/contacts/contact.model');
const Segment = require('../modules/segments/segment.model');
const Workflow = require('../modules/workflows/workflow.model');
const SegmentMembership = require('../modules/segments/segment_membership.model');
const { sequelize } = require('../config/database');
const { publish } = require('../modules/system/event_bus');

// Mock Kafka publish to loopback or intercept
jest.mock('../modules/system/event_bus');
jest.mock('../modules/workflows/execution.service');

describe('Segment Engine Integration', () => {
    let tenantId = 't-seg-test';

    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();
        // Create Tenant if needed (stubbed by using raw ID often, but let's be safe)
        const Tenant = require('../modules/tenants/tenant.model');
        await Tenant.create({ id: tenantId, name: 'Seg Tenant', plan: 'Free' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('1. Contact Update -> Matches Rule -> Adds Membership -> Emits Event', async () => {
        // 1. Create Segment: City = Paris
        const segment = await Segment.create({
            TenantId: tenantId,
            name: 'Parisians',
            ruleGroups: [{
                condition: 'AND',
                rules: [{ field: 'city', operator: 'equals', value: 'Paris' }]
            }]
        });

        // 2. Create Contact: Initially London
        const contact = await Contact.create({
            TenantId: tenantId,
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean@test.com',
            // We need to inject 'city' attribute. 
            // Since Contact model doesn't have it, we'll patch the object passed to evaluator
            // OR we assume evaluateSegmentsForContact re-fetches.
            // Wait, evaluateSegmentsForContact fetches Contact from DB.
            // If DB doesn't have 'city' column, this fails.
            // FIX: We must add 'attributes' or 'city' to Contact Model or use 'tags'.
            // Let's use 'firstName' for simplicity in this test OR 'tags' contains 'Paris'.
            // Let's use 'tags' contains 'Paris'.
        });

        // Update Segment Rule to use tags contains 'Paris'
        await segment.update({
            ruleGroups: [{
                condition: 'AND',
                rules: [{ field: 'tags', operator: 'contains', value: 'Paris' }]
            }]
        });

        // 3. Update Contact Tags
        await contact.update({ tags: ['Paris', 'VIP'] });

        // 4. Trigger Consumer Logic (Manually call internal function to avoid async kafka race conditions in unit test)
        await evaluateSegmentsForContact(tenantId, contact.id, 'test');

        // 5. Verify Membership
        const member = await SegmentMembership.findOne({ where: { SegmentId: segment.id, ContactId: contact.id } });
        expect(member).not.toBeNull();

        // 6. Verify Event Published
        expect(publish).toHaveBeenCalledWith('sys.segment.entry', expect.objectContaining({
            segment_id: segment.id,
            contact_id: contact.id
        }));
    });
});
