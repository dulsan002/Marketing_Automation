const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

describe('Workflow Validation Logic', () => {

    beforeAll(async () => {
        // Load all models
        require('../modules/contacts/contact.model');
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
    let campaignId = '';

    // Helper to create a user and tenant
    test('Setup: Register and Create Tenant', async () => {
        const email = `wf_val_${Date.now()}@test.com`;
        const resAuth = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });
        token = resAuth.body.data.accessToken;

        // Promote to Admin
        const User = require('../modules/auth/user.model');
        await User.update({ role: 'admin' }, { where: { email } });

        // Re-login to get admin token
        const resLogin = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
        token = resLogin.body.data.accessToken;

        const resTenant = await request(app).post('/api/tenants').send({ name: 'WF Validation Tenant' });
        tenantId = resTenant.body.data.id;
    });

    // Helper to create a campaign
    test('Setup: Create Campaign', async () => {
        const res = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Valid Campaign',
                type: 'Email',
                tenantId: tenantId,
                content: { subject: 'S', body: 'B', senderName: 'N', senderEmail: 'e@mail.com' }
            });
        campaignId = res.body.data.id;
    });

    // 1. Graph Validation
    test('1. Create Workflow with Cycle should FAIL', async () => {
        const cycleNodes = [
            { id: '1', type: 'Trigger' },
            { id: '2', type: 'Action' },
            { id: '3', type: 'Action' }
        ];
        const cycleEdges = [
            { source: '1', target: '2' },
            { source: '2', target: '3' },
            { source: '3', target: '2' } // Cycle 2-3
        ];

        const res = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Cyclic Workflow',
                tenantId,
                nodes: cycleNodes,
                edges: cycleEdges
            });

        // Current implementation allows anything, so this fail until we fix it.
        // We expect strict validation on SAVE (create/update) for meaningful graph structures?
        // Or only on Activate? The plan said "Validate workflow graph on save".
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Cycle detected/i);
    });

    test('2. Create Workflow with Orphan Node should FAIL', async () => {
        const nodes = [
            { id: '1', type: 'Trigger' },
            { id: '2', type: 'Action' }, // Orphan, no edge to it
        ];
        const edges = [];

        const res = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Orphan Workflow',
                tenantId,
                nodes,
                edges
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Orphan/i);
    });

    test('3. Create Workflow with Multiple Triggers should FAIL', async () => {
        const nodes = [
            { id: '1', type: 'Trigger' },
            { id: '2', type: 'Trigger' }
        ];
        const edges = [];

        const res = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Multi Trigger',
                tenantId,
                nodes,
                edges
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Exactly one trigger/i);
    });


    // 2. Campaign Integrity (On Activation)
    test('4. Activate Workflow with DRAFT Campaign should FAIL', async () => {
        // Create Valid Graph
        const workRes = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Campaign Ref Workflow',
                tenantId,
                nodes: [
                    { id: '1', type: 'Trigger' },
                    { id: '2', type: 'Action', data: { campaignId: campaignId } }
                ],
                edges: [{ source: '1', target: '2' }]
            });

        const wfId = workRes.body.data.id;

        // Attempt Activate
        const res = await request(app)
            .patch(`/api/workflows/${wfId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId,
                status: 'active'
            });

        expect(res.statusCode).toBe(500); // 500 or 400? Service throws Error, controller catches 500. ideally 400 for logic error.
        // Current controller returns 500 for error.message.
        // The service ALREADY HAS THIS CHECK (lines 44-46 in workflow.service.js).
        // So this should ALREADY PASS/FAIL CORRECTLY if logic is correct.
        // "Cannot activate workflow: Referenced campaign ... is not ACTIVE" is the message.
        expect(res.body.message).toMatch(/not ACTIVE/i);
    });

    test('5. Activate Workflow with ACTIVE Campaign should SUCCEED', async () => {
        // Activate Campaign first
        await request(app)
            .post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        // Create new Workflow or update old one
        const workRes = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Active Campaign Workflow',
                tenantId,
                nodes: [
                    { id: '1', type: 'Trigger' },
                    { id: '2', type: 'Action', data: { campaignId: campaignId } }
                ],
                edges: [{ source: '1', target: '2' }]
            });
        const wfId = workRes.body.data.id;

        // Activate
        const res = await request(app)
            .patch(`/api/workflows/${wfId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId,
                status: 'active'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('active');
    });

});
