const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const fs = require('fs');

const log = (msg) => fs.appendFileSync('manual_test.log', msg + '\n');

const run = async () => {
    try {
        fs.writeFileSync('manual_test.log', 'Starting Manual Test\n');
        await sequelize.sync({ force: true });
        log('DB Synced');

        // Setup Tenant
        const resTenant = await request(app)
            .post('/api/tenants')
            .send({ name: 'Manual Tenant' });

        log(`Tenant Status: ${resTenant.statusCode}`);
        log(`Tenant Body: ${JSON.stringify(resTenant.body)}`);

        if (resTenant.statusCode !== 201) throw new Error('Tenant Setup Failed');
        const tenantId = resTenant.body.data.id;

        // Create Segment
        const ruleGroups = [{ condition: 'AND', rules: [] }];
        const resSeg = await request(app)
            .post('/api/segments')
            .send({
                name: 'Manual Segment',
                type: 'Dynamic',
                tenantId: tenantId,
                ruleGroups
            }); // Note: No Auth middleware in manual test? 
        // Wait, segment routes ARE protected.
        // I need a token.

        log(`Segment Create Status (No Auth): ${resSeg.statusCode}`);
        // Should be 401.

        // I need to register first.
        const resAuth = await request(app)
            .post('/api/auth/register')
            .send({ email: 'manual@test.com', password: 'Password123!' });
        const token = resAuth.body.data.accessToken;

        const resSegAuth = await request(app)
            .post('/api/segments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Manual Segment Auth',
                type: 'Dynamic',
                tenantId: tenantId,
                ruleGroups
            });

        log(`Segment Create Status (Auth): ${resSegAuth.statusCode}`);
        log(`Segment Create Body: ${JSON.stringify(resSegAuth.body)}`);

    } catch (e) {
        log(`ERROR: ${e.stack}`);
    } finally {
        await sequelize.close();
    }
};

run();
