const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const eventBus = require('../common/event_bus');

describe('Workflow Engine Verification', () => {

    beforeAll(async () => {
        require('../modules/contacts/contact.model');
        require('../modules/tenants/tenant.model');
        require('../modules/campaigns/campaign.model');
        require('../modules/campaigns/campaign_version.model');
        require('../modules/workflows/workflow.model');
        require('../modules/workflows/workflow_campaign_ref.model');
        require('../modules/auth/user.model');
        require('../modules/segments/segment.model');
        require('../modules/abm/account.model');
        require('../modules/abm/intent_signal.model');

        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let token = '';
    let tenantId = '';
    let campaignId = '';
    let workflowId = '';

    test('Setup: Auth & Tenant', async () => {
        const resAuth = await request(app)
            .post('/api/auth/register')
            .send({ email: `wf_test_${Date.now()}@test.com`, password: 'Password123!' });
        token = resAuth.body.data.accessToken;

        const resTenant = await request(app)
            .post('/api/tenants')
            .send({ name: 'Workflow Corp' });
        tenantId = resTenant.body.data.id;
    });

    test('1. Create & Activate Campaign', async () => {
        const res = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Welcome Email',
                type: 'Email',
                tenantId,
                content: {
                    subject: 'Hello',
                    body: 'Welcome!',
                    senderName: 'Admin',
                    senderEmail: 'admin@test.com'
                }
            });
        campaignId = res.body.data.id;

        await request(app)
            .post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });
    });

    test('2. Create Workflow with Trigger', async () => {
        // Nodes: Trigger -> Condition -> Email
        const nodes = [
            { id: '1', type: 'trigger', data: { type: 'contact.created' }, position: { x: 0, y: 0 } },
            { id: '2', type: 'condition', data: { ruleGroups: [{ rules: [{ field: 'email', operator: 'contains', value: 'vip' }] }] }, position: { x: 100, y: 0 } },
            { id: '3', type: 'email', data: { campaignId }, position: { x: 200, y: 0 } }
        ];

        const edges = [
            { source: '1', target: '2' },
            { source: '2', target: '3', sourceHandle: 'true' } // Only email if VIP
        ];

        const res = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Onboarding Flow',
                trigger: { type: 'contact.created' }, // Trigger Definition
                nodes,
                edges,
                tenantId
            });

        workflowId = res.body.data.id;
        expect(res.statusCode).toBe(201);
    });

    test('3. Activate Workflow', async () => {
        const res = await request(app)
            .patch(`/api/workflows/${workflowId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                status: 'active',
                tenantId
            });
        expect(res.statusCode).toBe(200);
    });

    test('4. Trigger Workflow (Create Contact)', async () => {
        // We need to spy on console.log to verify execution steps
        const logSpy = jest.spyOn(console, 'log');

        const res = await request(app)
            .post('/api/contacts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                firstName: 'Very',
                lastName: 'Important',
                email: 'vip_user@test.com',
                tenantId
            });

        expect(res.statusCode).toBe(201);

        // Allow some time for async event processing
        await new Promise(r => setTimeout(r, 1000));

        // Verify Logs:
        // [TriggerListener] Event Received: contact_created
        // [WorkflowRunner] Starting Workflow...
        // [NodeExecutor] Executing Node 2 (condition)...
        // [NodeExecutor] ❓ Condition Evaluated: true
        // [NodeExecutor] 📧 Sending Email...

        const logs = logSpy.mock.calls.map(args => args.join(' '));
        const hasTrigger = logs.some(l => l.includes('[TriggerListener] Event Received: contact_created'));
        const hasRunner = logs.some(l => l.includes('[WorkflowRunner] Starting Workflow'));
        const hasEmail = logs.some(l => l.includes('📧 Sending Email'));

        expect(hasTrigger).toBe(true);
        expect(hasRunner).toBe(true);
        expect(hasEmail).toBe(true);

        logSpy.mockRestore();
    });
});
