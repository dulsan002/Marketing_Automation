const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');

describe('Health Check', () => {

    // afterAll(async () => {
    //   await sequelize.close();
    // });

    it('should return 200 OK', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });
});
