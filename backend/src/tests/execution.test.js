const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');

describe('Workflow Execution Stubs', () => {

    beforeAll(async () => {
        // Load models
        require('../modules/contacts/contact.model');
        require('../modules/campaigns/campaign.model');
        require('../modules/campaigns/campaign_version.model');
        require('../modules/workflows/workflow.model');
        require('../modules/workflows/workflow_campaign_ref.model');
        require('../modules/workflows/workflow_execution.model');
        require('../modules/tenants/tenant.model');
        require('../modules/auth/user.model');

        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let token = '';
    let tenantId = '';
    let campaignId = '';
    let workflowId = '';

    test('Setup: Register, Tenant, Campaign', async () => {
        // Auth
        const email = `exec_stub_${Date.now()}@test.com`;
        const resAuth = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });

        // Promote
        const User = require('../modules/auth/user.model');
        await User.update({ role: 'admin' }, { where: { email } });
        const resLogin = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
        token = resLogin.body.data.accessToken;

        // Tenant
        const resTenant = await request(app).post('/api/tenants').send({ name: 'Exec Tenant' });
        tenantId = resTenant.body.data.id;

        // Campaign (Active)
        const resCamp = await request(app).post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Active Camp', type: 'Email', tenantId, content: { subject: 'S', body: 'B', senderName: 'N', senderEmail: 'e@e.com' } });
        campaignId = resCamp.body.data.id;

        await request(app).post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`).send({ tenantId });
    });

    test('1. Create and Activate Workflow', async () => {
        const res = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Exec Workflow',
                tenantId,
                nodes: [
                    { id: '1', type: 'Trigger' },
                    { id: '2', type: 'Action', data: { campaignId } }
                ],
                edges: [{ source: '1', target: '2' }]
            });
        workflowId = res.body.data.id;

        const resAct = await request(app)
            .patch(`/api/workflows/${workflowId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId, status: 'active' });

        expect(resAct.statusCode).toBe(200);
        expect(resAct.body.data.status).toBe('active');
    });

    test('2. Execute Workflow', async () => {
        const res = await request(app)
            .post(`/api/workflows/${workflowId}/execute`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('COMPLETED');

        const logs = res.body.data.logs;
        expect(logs.length).toBeGreaterThan(0);

        // Verify Log Content
        const triggerLog = logs.find(l => l.message.includes('Visiting Trigger'));
        const actionLog = logs.find(l => l.message.includes('Sending Campaign'));

        expect(triggerLog).toBeDefined();
        expect(actionLog).toBeDefined();
        expect(actionLog.message).toContain(campaignId);
    });

    test('3. Execute Draft Workflow should FAIL', async () => {
        // Create new draft
        const res = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Draft Workflow',
                tenantId,
                nodes: [{ id: '1', type: 'Trigger' }],
                edges: []
            });
        const draftId = res.body.data.id;

        const resExec = await request(app)
            .post(`/api/workflows/${draftId}/execute`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(resExec.statusCode).toBe(400);
        expect(resExec.body.message).toMatch(/not active/i);
    });
});
