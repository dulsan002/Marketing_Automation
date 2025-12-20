const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const User = require('../modules/auth/user.model');

describe('Authentication Module', () => {

    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    // afterAll removed to avoid SQLite lock issues on Windows/Jest

    const generateEmail = () => `test_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
    const testUser = {
        email: generateEmail(),
        password: 'Password123!',
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const email = generateEmail();
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email, password: testUser.password });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('email', email);
        });

        it('should fail to register with an existing email', async () => {
            const email = generateEmail();
            // First register
            await request(app).post('/api/auth/register').send({ email, password: testUser.password });

            // Try again
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email, password: testUser.password });

            expect(res.statusCode).toEqual(409);
            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body).toHaveProperty('message', 'User already exists');
        });

        it('should fail if email or password is missing', async () => {
            const res = await request(app).post('/api/auth/register').send({ email: 'no_pass@test.com' });
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const email = generateEmail();
            // Register first
            await request(app).post('/api/auth/register').send({ email, password: testUser.password });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email, password: testUser.password });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data).toHaveProperty('token');
        });

        it('should fail with invalid password', async () => {
            const email = generateEmail();
            await request(app).post('/api/auth/register').send({ email, password: testUser.password });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: email,
                    password: 'WrongPassword',
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });
    });
});
