const { sequelize } = require('../backend/src/config/database');
const User = require('../backend/src/modules/auth/user.model');
const Tenant = require('../backend/src/modules/auth/tenant.model');

async function checkModels() {
    try {
        console.log('Syncing Database...');
        await sequelize.sync({ force: true }); // Force recreation
        console.log('✅ Database Synced Successfully');

        console.log('Creating Test Tenant...');
        const tenant = await Tenant.create({
            name: 'Test Corp',
            slug: 'test-corp'
        });
        console.log('✅ Tenant Created:', tenant.id);

        console.log('Creating Admin User...');
        const user = await User.create({
            tenantId: tenant.id,
            email: 'admin@test.com',
            password: 'hashedpassword',
            role: 'ADMIN'
        });
        console.log('✅ User Created:', user.id);

        console.log('✨ Model Verification Complete');
        process.exit(0);
    } catch (e) {
        console.error('❌ Model Verification Failed:', e);
        process.exit(1);
    }
}

checkModels();
