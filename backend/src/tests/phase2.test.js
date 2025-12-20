const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');

describe('Phase 2 Verification: Campaign Lifecycle', () => {

    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let token = '';
    let tenantId = '';
    let campaignId = '';

    // Setup: Register & Create Tenant
    test('Setup: Register and Create Tenant', async () => {
        const email = `phase2_${Date.now()}@test.com`;
        const resAuth = await request(app)
            .post('/api/auth/register')
            .send({ email, password: 'Password123!' });
        token = resAuth.body.data.accessToken;

        const resTenant = await request(app)
            .post('/api/tenants')
            .send({ name: 'Phase 2 Tenant' });
        tenantId = resTenant.body.data.id;
    });

    // 1. Draft Creation
    test('1. Draft Creation: Should return DRAFT and Version 1', async () => {
        const res = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Phase 2 Campaign',
                type: 'Email',
                tenantId: tenantId,
                content: { subject: 'Phase 2 Test' }
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.status).toBe('draft');
        expect(res.body.data.version).toBe(1);

        campaignId = res.body.data.id;
    });

    // 2. Version Increment (Update Draft)
    test('2. Version Increment: Updating draft should increment version', async () => {
        const res = await request(app)
            .patch(`/api/campaigns/${campaignId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Phase 2 Campaign Updated',
                tenantId: tenantId
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toBe('Phase 2 Campaign Updated');
        expect(res.body.data.version).toBe(2);
    });

    // 3. Activation
    test('3. Activation: Should change status to ACTIVE', async () => {
        const res = await request(app)
            .post(`/api/campaigns/${campaignId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('active');
    });

    // 4. Edit Active Campaign (Must Fail)
    test('4. Edit Active Campaign: Should FAIL with 400', async () => {
        const res = await request(app)
            .patch(`/api/campaigns/${campaignId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Illegal Update',
                tenantId: tenantId
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Cannot edit/i);
    });

    // 5. Archive Campaign
    test('5. Archive Campaign: Should change status to COMPLETED (Frontend Archive)', async () => {
        const res = await request(app)
            .post(`/api/campaigns/${campaignId}/archive`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('completed');
    });
});
