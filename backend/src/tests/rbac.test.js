const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const User = require('../modules/auth/user.model');

describe('RBAC Enforcement', () => {

    beforeAll(async () => {
        // Load Models
        require('../modules/contacts/contact.model');
        require('../modules/campaigns/campaign.model');
        require('../modules/campaigns/campaign_version.model');
        require('../modules/tenants/tenant.model');
        require('../modules/auth/user.model');

        const { syncDb } = require('./test_helper');
        await syncDb();
    });

    let adminToken = '';
    let editorToken = '';
    let viewerToken = '';
    let tenantId = '';

    test('Setup: Create Users and Tenant', async () => {
        // Tenant
        const resTenant = await request(app).post('/api/tenants').send({ name: 'RBAC Tenant' });
        tenantId = resTenant.body.data.id;

        // Admin (default role via manual update? or just assume admin if logic allows)
        // User model defaults to 'user'. We need to hack it or use a seeder.
        // Let's register then update DB directly for test speed.

        // Admin
        const resAdmin = await request(app).post('/api/auth/register').send({ email: 'admin@test.com', password: 'Password123!' });
        adminToken = resAdmin.body.data.accessToken;
        await User.update({ role: 'admin' }, { where: { email: 'admin@test.com' } });
        // Re-login to get new token with role? OR token generation logic reads from DB?
        // auth.utils usually signs the payload passed to it. Auth controller passes { id, email, role }.
        // Wait, controller passes user instance. Let's re-login.
        const loginAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Password123!' });
        adminToken = loginAdmin.body.data.accessToken;


        // Editor
        const resEditor = await request(app).post('/api/auth/register').send({ email: 'editor@test.com', password: 'Password123!' });
        await User.update({ role: 'editor' }, { where: { email: 'editor@test.com' } });
        const loginEditor = await request(app).post('/api/auth/login').send({ email: 'editor@test.com', password: 'Password123!' });
        editorToken = loginEditor.body.data.accessToken;

        // Viewer (default 'user' role, which is not 'editor' or 'admin')
        const resViewer = await request(app).post('/api/auth/register').send({ email: 'viewer@test.com', password: 'Password123!' });
        viewerToken = resViewer.body.data.accessToken;
    });

    // VIEWERS
    test('1. Viewer cannot create campaign', async () => {
        const res = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${viewerToken}`)
            .send({ name: 'Viewer Camp', type: 'Email', tenantId });

        expect(res.statusCode).toBe(403);
    });

    // EDITORS
    test('2. Editor can create campaign', async () => {
        const res = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${editorToken}`)
            .send({ name: 'Editor Camp', type: 'Email', tenantId });

        expect(res.statusCode).toBe(201);
        return res.body.data.id;
    });

    // ADMIN vs EDITOR on RESTRICTED
    test('3. Editor cannot Archive campaign (Admin only)', async () => {
        // Create one first
        const resC = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'To Archive', type: 'Email', tenantId });
        const id = resC.body.data.id;

        const res = await request(app)
            .post(`/api/campaigns/${id}/archive`)
            .set('Authorization', `Bearer ${editorToken}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(403);
    });

    test('4. Admin can Archive campaign', async () => {
        // Create one first
        const resC = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'To Archive Admin', type: 'Email', tenantId });
        const id = resC.body.data.id;

        const res = await request(app)
            .post(`/api/campaigns/${id}/archive`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ tenantId });

        expect(res.statusCode).toBe(200);
    });

});
