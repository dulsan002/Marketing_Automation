const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

describe('Campaign Lifecycle Verification', () => {

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
    let campaignId = '';

    // Setup: Create User, Tenant
    test('Setup: Register and Create Tenant', async () => {
        const email = `lifecycle_${Date.now()}@test.com`;
        const resAuth = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });

        // Promote for RBAC
        const User = require('../modules/auth/user.model');
        await User.update({ role: 'admin' }, { where: { email } });
        const resLogin = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
        token = resLogin.body.data.accessToken;

        const resTenant = await request(app).post('/api/tenants').send({ name: 'Lifecycle Tenant' });
        tenantId = resTenant.body.data.id;
        expect(tenantId).toBeDefined();
    });

    // 1. Create Campaign (Draft)
    test('1. Create Campaign creates Version 1', async () => {
        const res = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Versioned Email',
                type: 'Email',
                tenantId: tenantId,
                content: { subject: 'V1 Subject', body: 'V1 Body', senderName: 'Me', senderEmail: 'me@co.com' }
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.activeVersion).toBe(1);
        expect(res.body.data.content.subject).toBe('V1 Subject');
        campaignId = res.body.data.id;
    });

    test('2. Updating DRAFT does not increment version (mutable draft)', async () => {
        const res = await request(app)
            .patch(`/api/campaigns/${campaignId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId,
                content: { subject: 'V1 Revised', body: 'V1 Body', senderName: 'Me', senderEmail: 'me@co.com' }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.activeVersion).toBe(1);
        expect(res.body.data.content.subject).toBe('V1 Revised');
    });

    // 3. Activate Campaign
    test('3. Activate Campaign should change status to ACTIVE', async () => {
        const res = await request(app)
            .post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('ACTIVE');
    });

    // 4. Update Active Campaign (Success -> New Version)
    test('4. Updating ACTIVE campaign should FAIL (Immutable)', async () => {
        const res = await request(app)
            .patch(`/api/campaigns/${campaignId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId,
                content: { subject: 'V2 Subject', body: 'V2 Body', senderName: 'Me', senderEmail: 'me@co.com' }
            });

        expect(res.statusCode).toBe(400); // Bad Request
        expect(res.body.message).toMatch(/Cannot edit a campaign that is active/i);
    });

    test('4b. Deactivate Campaign (Active -> Draft) should SUCCEED', async () => {
        const res = await request(app)
            .patch(`/api/campaigns/${campaignId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId,
                status: 'DRAFT'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('DRAFT');
    });

    // Now that it is Draft, we should be able to edit it (User Request)
    test('4c. Edit Draft Campaign should SUCCEED', async () => {
        const res = await request(app)
            .patch(`/api/campaigns/${campaignId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId,
                content: { subject: 'V2 Subject (Edited)', body: 'V2 Body', senderName: 'Me', senderEmail: 'me@co.com' }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.content.subject).toBe('V2 Subject (Edited)');
    });

    test('5. Verify V1 remains active and unchanged', async () => {
        const res = await request(app)
            .get(`/api/campaigns/${campaignId}`)
            .query({ tenantId })
            .set('Authorization', `Bearer ${token}`);

        expect(res.body.data.activeVersion).toBe(1);
    });

    // 5. Archive Campaign
    test('5. Archive Campaign should change status to ARCHIVED', async () => {
        const res = await request(app)
            .post(`/api/campaigns/${campaignId}/archive`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('ARCHIVED');
    });

    // 6. Update Archived Campaign (Fail)
    test('6. Update Archived Campaign should FAIL', async () => {
        const res = await request(app)
            .patch(`/api/campaigns/${campaignId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Should Not Change Again',
                tenantId: tenantId
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Cannot edit/i);
    });

    // 7. Activate Archived Campaign (Fail)
    test('7. Activate Archived Campaign should FAIL', async () => {
        const res = await request(app)
            .post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/invalid state/i);
    });
});
