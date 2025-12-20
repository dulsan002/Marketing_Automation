const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');

describe('Enterprise Foundation Verification', () => {

    beforeAll(async () => {
        // Explicitly require models to ensure they are defined before sync
        require('../modules/contacts/contact.model');
        require('../modules/abm/account.model');
        require('../modules/abm/intent_signal.model');
        require('../modules/campaigns/campaign.model');
        require('../modules/campaigns/campaign_version.model');
        require('../modules/workflows/workflow.model');
        require('../modules/workflows/workflow_campaign_ref.model');
        require('../modules/tenants/tenant.model');
        require('../modules/auth/user.model');

        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let token = '';
    let tenantId = '';
    let contactId = '';
    let accountId = '';
    let campaignId = '';
    let workflowId = '';

    test('Setup: Auth & Tenant', async () => {
        const resAuth = await request(app)
            .post('/api/auth/register')
            .send({ email: `found_${Date.now()}@test.com`, password: 'Password123!' });
        token = resAuth.body.data.accessToken;

        const resTenant = await request(app)
            .post('/api/tenants')
            .send({ name: 'Foundations Corp' });
        tenantId = resTenant.body.data.id;
    });

    test('1. Lead Scoring Fields verify on Contact', async () => {
        // Create Account first for Contact link
        const resAcc = await request(app)
            .post('/api/abm/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Acme Corp', tenantId });
        accountId = resAcc.body.data.id;

        const resContact = await request(app)
            .post('/api/contacts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@acme.com',
                tenantId,
                AccountId: accountId
            });

        expect(resContact.statusCode).toBe(201);
        expect(resContact.body.data.score).toBe(0);
        contactId = resContact.body.data.id;
    });

    test('2. Intent Signals Model & Create', async () => {
        // Since there is no controller for IntentSignals yet, we might check DB or just assume it works if we add it to ABM module
        // Let's assume we want to verify the model exists and can be saved
        const IntentSignal = require('../modules/abm/intent_signal.model');
        const signal = await IntentSignal.create({
            accountId,
            contactId,
            source: 'Website',
            signalType: 'Pricing Page Visit',
            weight: 20,
            tenantId
        });
        expect(signal.id).toBeDefined();
        expect(signal.weight).toBe(20);
    });

    test('3. Workflow Activation locks referenced Campaign Version', async () => {
        // 1. Create Campaign
        const resCamp = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Locked Camp',
                type: 'Email',
                tenantId,
                content: { subject: 'Lock Me', body: 'Text', senderName: 'Me', senderEmail: 'me@me.com' }
            });
        campaignId = resCamp.body.data.id;

        // 2. Activate Campaign (status -> ACTIVE)
        await request(app)
            .post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        // 3. Create Workflow referencing Campaign
        const resWf = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Safety Workflow',
                tenantId,
                nodes: [
                    { id: '1', type: 'campaign', data: { campaignId } }
                ]
            });
        workflowId = resWf.body.data.id;

        // 4. Activate Workflow
        const resWfAct = await request(app)
            .patch(`/api/workflows/${workflowId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId, status: 'active' });

        expect(resWfAct.statusCode).toBe(200);
        expect(resWfAct.body.data.status).toBe('active');

        // 5. Verify Campaign Reference exists and is locked
        const WorkflowCampaignRef = require('../modules/workflows/workflow_campaign_ref.model');
        const ref = await WorkflowCampaignRef.findOne({ where: { workflowId } });
        expect(ref).toBeDefined();

        const CampaignVersion = require('../modules/campaigns/campaign_version.model');
        const version = await CampaignVersion.findByPk(ref.campaignVersionId);
        expect(version.isLocked).toBe(true);
    });
});
