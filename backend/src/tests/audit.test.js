const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const ActivityLog = require('../modules/system/activity_log.model');

describe('Unified Activity Log', () => {

    beforeAll(async () => {
        // Load All Models
        require('../modules/contacts/contact.model');
        require('../modules/campaigns/campaign.model');
        require('../modules/campaigns/campaign_version.model');
        require('../modules/workflows/workflow.model');
        require('../modules/workflows/workflow_campaign_ref.model');
        require('../modules/workflows/workflow_execution.model');
        require('../modules/tenants/tenant.model');
        require('../modules/auth/user.model');
        require('../modules/system/activity_log.model');

        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let token = '';
    let tenantId = '';
    let campaignId = '';

    test('Setup: Register & Tenant', async () => {
        const email = `audit_${Date.now()}@test.com`;
        const resAuth = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });

        // Promote
        const User = require('../modules/auth/user.model');
        await User.update({ role: 'admin' }, { where: { email } });
        const resLogin = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
        token = resLogin.body.data.accessToken;

        const resTenant = await request(app).post('/api/tenants').send({ name: 'Audit Tenant' });
        tenantId = resTenant.body.data.id;
    });

    test('1. Activate Campaign -> Should Log Activity', async () => {
        // Create Campaign
        const resCamp = await request(app).post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Audit Camp', type: 'Email', tenantId, content: { subject: 'S', body: 'B', senderName: 'N', senderEmail: 'e@e.com' } });
        campaignId = resCamp.body.data.id;

        // Activate
        await request(app).post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        // Verify Log
        const logs = await ActivityLog.findAll({
            where: { entityType: 'Campaign', entityId: campaignId, action: 'ACTIVATED' }
        });

        expect(logs.length).toBe(1);
        expect(logs[0].TenantId).toBe(tenantId);
        expect(logs[0].metadata).toBeDefined();
    });

    test('2. Archive Campaign -> Should Log Activity', async () => {
        // Archive
        // Note: Deactivating active->draft doesn't have a route yet? Or is it patch?
        // In strict lifecycle, we can Archive directly or Deactivate (status=DRAFT).
        // The service only logs ARCHIVED. Let's archive.

        await request(app).post(`/api/campaigns/${campaignId}/archive`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        const logs = await ActivityLog.findAll({
            where: { entityType: 'Campaign', entityId: campaignId, action: 'ARCHIVED' }
        });
        expect(logs.length).toBe(1);
    });

    test('3. Activate Workflow -> Should Log Activity', async () => {
        // Need ACTIVE campaign for workflow. 
        // Create another one since previous is archived.
        const resCamp = await request(app).post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'For WF', type: 'Email', tenantId, content: { subject: 'S', body: 'B', senderName: 'N', senderEmail: 'e@e.com' } });
        const camp2Id = resCamp.body.data.id;
        await request(app).post(`/api/campaigns/${camp2Id}/activate`)
            .set('Authorization', `Bearer ${token}`).send({ tenantId });

        const resWf = await request(app)
            .post('/api/workflows')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Audit Workflow',
                tenantId,
                nodes: [
                    { id: '1', type: 'Trigger' },
                    { id: '2', type: 'Action', data: { campaignId: camp2Id } }
                ],
                edges: [{ source: '1', target: '2' }]
            });
        const wfId = resWf.body.data.id;

        await request(app)
            .patch(`/api/workflows/${wfId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId, status: 'active' });

        const logs = await ActivityLog.findAll({
            where: { entityType: 'Workflow', entityId: wfId, action: 'ACTIVATED' }
        });
        expect(logs.length).toBe(1);
    });

});
