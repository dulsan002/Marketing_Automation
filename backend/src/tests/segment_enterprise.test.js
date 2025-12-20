const { evaluateSegmentsForContact } = require('../modules/segments/engine/consumer');
const Contact = require('../modules/contacts/contact.model');
const Segment = require('../modules/segments/segment.model');
const SegmentMembership = require('../modules/segments/segment_membership.model');
const BehavioralService = require('../modules/segments/engine/behavioral.service');
const { sequelize } = require('../config/database');
const { redisClient } = require('../config/redis');

// Mocks
jest.mock('../modules/system/event_bus');
jest.mock('../modules/segments/engine/behavioral.service');
jest.mock('../config/redis', () => ({
    redisClient: {
        set: jest.fn().mockResolvedValue('OK'), // Always successful for manual calls? 
        // In consumer we use 'set' with options.
        // Let's rely on manual evaluateSegmentsForContact for this test to bypass Redis logic 
        // (unit test logic), OR we can test Redis mocking separately.
        // The consumer uses evaluateSegmentsForContact.
        // We will call evaluateSegmentsForContact directly to test ENGINE logic.
    }
}));

describe('Enterprise Segment Engine', () => {
    let tenantId = 't-ent-seg';

    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();
        const Tenant = require('../modules/tenants/tenant.model');
        await Tenant.create({ id: tenantId, name: 'Ent Tenant', plan: 'Enterprise' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Behavioral Rule (Email Open > 1) Triggers Entry', async () => {
        // 1. Create Contact
        const contact = await Contact.create({
            TenantId: tenantId,
            firstName: 'Behav',
            lastName: 'User',
            email: 'behav@test.com'
        });

        // 2. Create Segment with Behavioral Rule
        const segment = await Segment.create({
            TenantId: tenantId,
            name: 'Engaged Users',
            ruleGroups: [{
                condition: 'AND',
                rules: [{ eventType: 'EMAIL_OPENED', operator: 'greater_than', value: 1 }]
            }]
        });

        // 3. Mock Behavioral Service to return TRUE (count = 2)
        BehavioralService.checkCondition.mockResolvedValue(true);

        // 4. Evaluate
        await evaluateSegmentsForContact(tenantId, contact.id, 'map.email.opened');

        // 5. Verify Membership
        const member = await SegmentMembership.findOne({
            where: { SegmentId: segment.id, ContactId: contact.id, exitedAt: null }
        });
        expect(member).not.toBeNull();
        expect(BehavioralService.checkCondition).toHaveBeenCalled();
    });

    test('Segment Exit records History (exitedAt)', async () => {
        const contact = await Contact.findOne({ where: { email: 'behav@test.com' } });
        const segment = await Segment.findOne({ where: { name: 'Engaged Users' } });

        // 1. Mock Behavioral Service to return FALSE (count = 0)
        BehavioralService.checkCondition.mockResolvedValue(false);

        // 2. Evaluate
        await evaluateSegmentsForContact(tenantId, contact.id, 'map.email.opened');

        // 3. Verify Active Membership Gone
        const activeMember = await SegmentMembership.findOne({
            where: { SegmentId: segment.id, ContactId: contact.id, exitedAt: null }
        });
        expect(activeMember).toBeNull();

        // 4. Verify History Record Exists
        const historyMember = await SegmentMembership.findOne({
            where: { SegmentId: segment.id, ContactId: contact.id }
        });
        expect(historyMember).not.toBeNull();
        expect(historyMember.exitedAt).not.toBeNull();
    });
});
