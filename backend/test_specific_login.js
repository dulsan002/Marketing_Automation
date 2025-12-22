
const { login } = require('./src/modules/auth/auth.service');
const { sequelize } = require('./src/config/database');

const testSpecificLogin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const tenantSlug = 'acme-corp';
        const email = 'admin@example.com';
        const password = 'admin123';

        console.log(`Testing Login for: ${tenantSlug} / ${email} / ${password}`);

        try {
            const loginResult = await login(tenantSlug, email, password);
            console.log('SUCCESS! Token received:', !!loginResult.accessToken);
        } catch (authErr) {
            console.error('LOGIN FAILED:', authErr.message);
        }

    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    } finally {
        await sequelize.close();
    }
};

testSpecificLogin();
