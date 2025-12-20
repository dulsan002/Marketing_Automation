const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const { verifyAccessToken } = require('../modules/auth/auth.utils');
const jwt = require('jsonwebtoken');

describe('Phase 1 Verification: JWT Authentication', () => {

    // Ensure DB is fresh for these tests
    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    const email = `phase1_${Date.now()}@test.com`;
    const password = 'SecurePass123!';
    let accessToken = '';
    let refreshToken = '';

    // 1. Register
    test('1. Register should return tokens', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email, password });

        expect(res.statusCode).toBe(201);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
        expect(res.body.data.user).toHaveProperty('id');
    });

    // 2. Login
    test('2. Login should return tokens', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email, password });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');

        // Save for later steps
        accessToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
    });

    // 3. Invalid Password
    test('3. Invalid Password should return 401', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email, password: 'WrongPassword' });

        expect(res.statusCode).toBe(401);
    });

    // 4. Access Token Validity (Via Protected Route)
    test('4. Access Token should grant access to protected route', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('email', email);
    });

    // 5. Expired Token
    test('5. Expired Access Token should be rejected', async () => {
        // Generate expired token
        const expiredToken = jwt.sign(
            { id: 'expired_user', email: 'expired@test.com' },
            process.env.JWT_ACCESS_SECRET || 'access_secret_123',
            { expiresIn: '-1s' }
        );

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${expiredToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/Expired/i);
    });

    // 6. Refresh Token Flow
    test('6. Refresh Token should return NEW tokens (Rotation)', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');

        // Verify Rotation: New refresh token should be different
        expect(res.body.data.refreshToken).not.toBe(refreshToken);

        // Update current valid token
        refreshToken = res.body.data.refreshToken;
    });

    // 7. Invalid Refresh Token
    test('7. Invalid Refresh Token should be rejected', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: 'invalid_token_string' });

        expect(res.statusCode).toBe(403);
    });
});
