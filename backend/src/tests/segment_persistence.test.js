const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const Segment = require('../modules/segments/segment.model');
const Tenant = require('../modules/tenants/tenant.model');

describe('Segments Module Verification', () => {

    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let token = '';
    let tenantId = '';
    let segmentId = '';

    // Setup
    test('Setup: Register and Create Tenant', async () => {
        const email = `seg_${Date.now()}@test.com`;
        const resAuth = await request(app)
            .post('/api/auth/register')
            .send({ email, password: 'Password123!' });

        expect(resAuth.statusCode).toBe(201);
        token = resAuth.body.data.accessToken;

        const resTenant = await request(app)
            .post('/api/tenants')
            .send({ name: 'Segment Tenant' });

        expect(resTenant.statusCode).toBe(201);
        tenantId = resTenant.body.data.id;
        expect(tenantId).toBeDefined();
    });

    // 1. Create Segment
    test('1. Create Segment should save JSON rules and calc count', async () => {
        const ruleGroups = [
            {
                condition: 'AND',
                rules: [
                    { field: 'email', operator: 'contains', value: '@gmail.com' },
                    { field: 'age', operator: 'gt', value: '18' }
                ]
            }
        ];

        const res = await request(app)
            .post('/api/segments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'High Value Users',
                type: 'Dynamic',
                tenantId: tenantId,
                ruleGroups: ruleGroups
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.name).toBe('High Value Users');
        expect(res.body.data.ruleGroups).toHaveLength(1);
        expect(res.body.data.ruleGroups[0].rules).toHaveLength(2);
        expect(res.body.data.rulesCount).toBe(2); // Hook calculation check
        expect(res.body.data.members).toBeDefined(); // Mock calc check

        segmentId = res.body.data.id;
    });

    // 2. Get Segment
    test('2. Get Segment should return correct JSON', async () => {
        const res = await request(app)
            .get(`/api/segments/${segmentId}?tenantId=${tenantId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.id).toBe(segmentId);
        expect(res.body.data.ruleGroups[0].condition).toBe('AND');
    });

    // 3. Update Segment
    test('3. Update Segment should update rules and recalc', async () => {
        const newRules = [
            {
                condition: 'OR',
                rules: [
                    { field: 'tag', operator: 'eq', value: 'VIP' }
                ]
            }
        ];

        const res = await request(app)
            .patch(`/api/segments/${segmentId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                tenantId: tenantId,
                ruleGroups: newRules,
                name: 'VIP Users'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toBe('VIP Users');
        expect(res.body.data.rulesCount).toBe(1); // 2 -> 1
    });

    // 4. Delete Segment
    test('4. Delete Segment should remove it', async () => {
        const res = await request(app)
            .delete(`/api/segments/${segmentId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(200);

        // Verify gone
        const check = await request(app)
            .get(`/api/segments/${segmentId}?tenantId=${tenantId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(check.statusCode).toBe(404);
    });
});
