const { login } = require('./src/modules/auth/auth.service');
const { sequelize } = require('./src/config/database');

async function testLogin() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        // Try the known admin
        console.log('Attempting login for admin@demo-corp.com...');
        const result = await login('demo-corp', 'admin@demo-corp.com', 'Password123!');
        console.log('Login Success:', result.user.email);

    } catch (e) {
        console.error('Login Failed:', e);
        console.error('Stack:', e.stack);
    } finally {
        await sequelize.close();
    }
}

testLogin();
