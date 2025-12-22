
const { register, login } = require('./src/modules/auth/auth.service');
const { sequelize } = require('./src/config/database');
const Tenant = require('./src/modules/tenants/tenant.model');
const User = require('./src/modules/auth/user.model');

const testFlow = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const timestamp = Date.now();
        const tenantName = `TestTenant${timestamp}`;
        const email = `test${timestamp}@example.com`;
        const password = 'Password123!';

        console.log(`\n1. Registering: ${tenantName}, ${email}`);
        const regResult = await register(tenantName, email, password);
        console.log('Registration successful:', regResult.user.id);

        const tenantSlug = regResult.user.tenantSlug;
        console.log(`Tenant Slug: ${tenantSlug}`);

        console.log(`\n2. Logging in...`);
        const loginResult = await login(tenantSlug, email, password);
        console.log('Login successful! AccessToken:', loginResult.accessToken ? 'Present' : 'Missing');

    } catch (e) {
        console.error('TEST FAILED:', e.message);
        if (e.errors) console.error(e.errors);
    } finally {
        await sequelize.close();
    }
};

testFlow();
