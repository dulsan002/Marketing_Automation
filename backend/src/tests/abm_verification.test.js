const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');

describe('ABM Module Verification', () => {

    beforeAll(async () => {
        // Ensure DB is synced (using existing state is likely fine as per dev env)
        // or force sync if we want isolation. 
        // Given existing run, let's try not to wipe everything if possible, 
        // but for reliable tests normally we do. 
        // For this check, I'll rely on the app running or just transient DB if using sqlite memory/file.
        // Actually, let's just use the app as is.
    });

    let token = '';
    let tenantId = '';
    let accountId = '';

    test('1. Auth & Setup', async () => {
        // Register a new user to ensure we have a valid token
        const email = `abm_test_${Date.now()}@test.com`;
        const resAuth = await request(app)
            .post('/api/auth/register')
            .send({ email, password: 'Password123!' });

        expect(resAuth.statusCode).toBe(201);
        token = resAuth.body.data.accessToken;

        // Create a Tenant
        const resTenant = await request(app)
            .post('/api/tenants')
            .send({ name: 'ABM Corp' });
        tenantId = resTenant.body.data.id;
    });

    test('2. Create Account', async () => {
        const res = await request(app)
            .post('/api/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Target Account A',
                domain: 'target-a.com',
                industry: 'Tech',
                tier: 'Tier 1',
                revenue: 1000000,
                employees: 50,
                tenantId: tenantId
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.name).toBe('Target Account A');
        accountId = res.body.data.id;
    });

    test('3. Get All Accounts', async () => {
        const res = await request(app)
            .get('/api/accounts')
            .set('Authorization', `Bearer ${token}`)
            .query({ tenantId }); // Assuming filtering by tenant might be required or default

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.find(a => a.id === accountId)).toBeTruthy();
    });

    test('4. Get One Account', async () => {
        const res = await request(app)
            .get(`/api/accounts/${accountId}`)
            .query({ tenantId })
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.id).toBe(accountId);
    });

    test('5. Update Account', async () => {
        const res = await request(app)
            .patch(`/api/accounts/${accountId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                score: 85,
                tier: 'Tier 2',
                tenantId
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.score).toBe(85);
        expect(res.body.data.tier).toBe('Tier 2');
    });

});
