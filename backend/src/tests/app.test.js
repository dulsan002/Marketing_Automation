const request = require('supertest');

// Mock the auth routes to inject a route that triggers an error
jest.mock('../modules/auth/auth.routes', () => {
    const express = require('express');
    const router = express.Router();
    // Add a test route that we can call
    router.get('/test-error', (req, res, next) => {
        const error = new Error('Test Error');
        error.status = 400;
        next(error);
    });
    return router;
});

const app = require('../app');

describe('Express App Initialization', () => {

    // Test Health Check
    test('GET /api/health should return 200 OK', async () => {
        const response = await request(app).get('/api/health');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('timestamp');
    });

    // Test 404 Handler
    test('GET /api/unknown-route should return 404', async () => {
        const response = await request(app).get('/api/unknown-route');
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Not Found');
    });

    // Test Global Error Handler
    test('Global Error Handler should return structured JSON', async () => {
        // Call the mocked route mounted at /api/auth/test-error
        const response = await request(app).get('/api/auth/test-error');

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('message', 'Test Error');
    });
});
