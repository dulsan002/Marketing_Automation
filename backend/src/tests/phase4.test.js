const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const Workflow = require('../modules/workflows/workflow.model');
const Campaign = require('../modules/campaigns/campaign.model');

describe('Phase 4: Workflows & System Safety', () => {

    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let token = '';
    let tenantId = '';
    let campaignId = '';
    let workflowId = '';

    // Setup
    test('Setup: Register, Tenant, Campaign', async () => {
        // 1. Auth
        const resAuth = await request(app)
            .post('/api/auth/register')
            .send({ email: `ph4_${Date.now()}@test.com`, password: 'Password123!' });
        token = resAuth.body.data.accessToken;

        // 2. Tenant
        const resTenant = await request(app)
            .post('/api/tenants')
            .send({ name: 'Safety First Corp' });
        tenantId = resTenant.body.data.id;

        // 3. Campaign (Draft)
        const resCamp = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Welcome Email',
                type: 'Email',
                tenantId: tenantId,
                content: { subject: 'Hi', body: 'Welcome', senderName: 'Me', senderEmail: 'me@co.com' }
            });
        campaignId = resCamp.body.data.id;
    });

    // Task 4.1: Workflow Persistence
    test('1. Create Workflow (Draft) should persist graph', async () => {
        const nodes = [
            { id: '1', type: 'trigger', data: {} },
            { id: '2', type: 'action', data: { campaignId: campaignId } }
        ];
        const edges = [{ source: '1', target: '2' }];

        const res = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Onboarding Flow',
                tenantId: tenantId,
                nodes,
                edges
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.nodes).toHaveLength(2);
        workflowId = res.body.data.id;
    });

    // Task 4.2 Safety Check 1: Activate Workflow with Draft Campaign -> FAIL
    test('2. Activate Workflow should FAIL if campaign is not Active', async () => {
        const res = await request(app)
            .patch(`/api/workflows/${workflowId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId: tenantId,
                status: 'active'
            });

        expect(res.statusCode).toBe(500); // Service throws Error
        expect(res.body.message).toMatch(/not Active/);
    });

    // Fix: Activate Campaign first
    test('3. Activate Campaign', async () => {
        const res = await request(app)
            .post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });
        expect(res.statusCode).toBe(200);
    });

    // Task 4.2 Safety Check 2: Activate Workflow NOW -> SUCCESS
    test('4. Activate Workflow should SUCCEED now', async () => {
        const res = await request(app)
            .patch(`/api/workflows/${workflowId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId: tenantId,
                status: 'active'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('active');
    });

    // Task 4.2 Safety Check 3: Archive Active Campaign used in Active Workflow -> FAIL
    test('5. Archive Campaign should FAIL if used in Active Workflow', async () => {
        const res = await request(app)
            .post(`/api/campaigns/${campaignId}/archive`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(500); // Service throws Error
        expect(res.body.message).toMatch(/used in an active workflow/);
    });

    // Cleanup: Pause Workflow -> Archive Campaign
    test('6. Pause Workflow allows Campaign Archive', async () => {
        // Pause Workflow
        await request(app)
            .patch(`/api/workflows/${workflowId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId, status: 'paused' });

        // Now Archive Campaign
        const res = await request(app)
            .post(`/api/campaigns/${campaignId}/archive`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('completed');
    });
});
