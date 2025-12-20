const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');

describe('Analytics Skeleton', () => {

    beforeAll(async () => {
        require('../modules/auth/user.model');
        require('../modules/tenants/tenant.model');
        // Other models not strictly needed for logicless endpoints, but good practice
        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let token = '';

    test('Setup: Register', async () => {
        const email = `analytics_${Date.now()}@test.com`;
        const resAuth = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });
        token = resAuth.body.data.accessToken;
    });

    test('1. Get Campaign Analytics -> Should return ClickHouse Data', async () => {
        // Mock ClickHouse Response
        const { clickhouse } = require('../config/clickhouse');
        clickhouse.query.mockResolvedValue({
            json: async () => [
                { event_type: 'SENT', count: '100' },
                { event_type: 'OPEN', count: '40' }
            ]
        });

        const res = await request(app)
            .get('/api/analytics/campaigns/some-uuid')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.sent).toBe(100);
        expect(res.body.data.opened).toBe(40);
        expect(res.body.data.openRate).toBe(40.0);
    });

    test('2. Get Account Analytics -> Should return Mock Data', async () => {
        const res = await request(app)
            .get('/api/analytics/accounts/some-uuid')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.engagementScore).toBeDefined();
    });

    test('3. Get Event Analytics -> Should return Mock Data', async () => {
        const res = await request(app)
            .get('/api/analytics/events/some-uuid')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.attendanceRate).toBeDefined();
    });
});
