const EmailService = require('../modules/providers/email/email.service');
const { startExecution } = require('../modules/workflows/execution.service');
const Contact = require('../modules/contacts/contact.model');
const Campaign = require('../modules/campaigns/campaign.model');
const CampaignVersion = require('../modules/campaigns/campaign_version.model');
const Workflow = require('../modules/workflows/workflow.model');
const { sequelize } = require('../config/database');
const { publish } = require('../modules/system/event_bus');

// Mocks
jest.mock('../modules/system/event_bus');
// We don't mock EmailService completely, we want to test its logic, but maybe mock the provider?
// Or mock EmailService.sendEmail if we want to test Execution integration only.
// Let's spy on EmailService.sendEmail to verify it's called.
jest.spyOn(EmailService, 'sendEmail');

describe('Provider Integration', () => {
    let tenantId = 't-prov-test';

    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();
        const Tenant = require('../modules/tenants/tenant.model');
        await Tenant.create({ id: tenantId, name: 'Prov Tenant', plan: 'Free' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Workflow Action Node sends Email via Service', async () => {
        // 1. Create Contact
        const contact = await Contact.create({
            TenantId: tenantId,
            firstName: 'Alice',
            lastName: 'Sender',
            email: 'alice@test.com'
        });

        // 2. Create Campaign
        const campaign = await Campaign.create({
            TenantId: tenantId,
            name: 'Welcome Email',
            type: 'Email',
            status: 'ACTIVE',
            activeVersion: 1
        });
        await CampaignVersion.create({
            campaignId: campaign.id,
            version: 1,
            content: {
                subject: 'Hello Alice',
                body: '<h1>Welcome!</h1>',
                senderName: 'Bot',
                senderEmail: 'bot@revops.com'
            },
            isLocked: true
        });

        // 3. Create Workflow
        const workflow = await Workflow.create({
            TenantId: tenantId,
            name: 'Email Flow',
            status: 'active',
            nodes: [
                { id: 'start', type: 'Trigger', data: { type: 'manual' } },
                { id: 'act1', type: 'Action', data: { campaignId: campaign.id } }
            ],
            edges: [
                { source: 'start', target: 'act1' }
            ]
        });

        // 4. Run Execution
        await startExecution(workflow.id, tenantId, { contactId: contact.id });

        // 5. Verify EmailService called
        expect(EmailService.sendEmail).toHaveBeenCalledWith(
            campaign.id,
            expect.objectContaining({ id: contact.id, email: 'alice@test.com' }),
            '<h1>Welcome!</h1>',
            'Hello Alice'
        );

        // 6. Verify Event Bus
        // Provider -> EmailService -> EventBus
        expect(publish).toHaveBeenCalledWith('map.email.sent', expect.objectContaining({
            contact_id: contact.id,
            campaign_id: campaign.id
        }));
    });
});
