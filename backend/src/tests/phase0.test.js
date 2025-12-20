const request = require('supertest');
const app = require('../app');
const { sequelize, connectDB } = require('../config/database');

describe('Phase 0 Verification', () => {

    beforeAll(async () => {
        // Ensure DB is connected and synced before running tests
        await connectDB();
        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    // 1. Start Server (Health Check)
    test('Server should start and respond to health check', async () => {
        const response = await request(app).get('/api/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('ok');
    });

    // 2. Check DB Connectivity
    test('Database should be connected', async () => {
        await expect(sequelize.authenticate()).resolves.not.toThrow();
    });

    // 3. Validate Schema Exists
    test('Database schema should exist (Users table)', async () => {
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('Existing tables:', tables);
        // SQLite tables might be returned as objects or strings depending on version/dialect options
        // Usually for SQLite in Sequelize it returns an array of table names.
        // Checking for 'Users' or 'users' depending on model definition. 
        // Our model is 'User' but usually pluralized to 'Users' by default in Sequelize unless frozenTableName is true.

        // Let's check broadly
        const tableNames = tables.map(t => typeof t === 'object' ? t.tableName : t);
        expect(tableNames.some(t => t === 'Users')).toBe(true);
    });
});
