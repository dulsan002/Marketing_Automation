
const { sequelize } = require('./src/config/database');
const Tenant = require('./src/modules/tenants/tenant.model');
const User = require('./src/modules/auth/user.model');
const bcrypt = require('bcryptjs');

const fix = async () => {
    const t = await sequelize.transaction();
    try {
        console.log('Connecting...');
        await sequelize.authenticate();

        // 1. Ensure Tenant 'acme-corp' exists
        let tenant = await Tenant.findOne({ where: { slug: 'acme-corp' } });
        if (!tenant) {
            console.log('Creating Tenant: acme-corp');
            tenant = await Tenant.create({
                name: 'Acme Corp',
                slug: 'acme-corp',
                subscriptionPlan: 'enterprise',
                status: 'ACTIVE'
            }, { transaction: t });
        } else {
            console.log('Tenant acme-corp already exists.');
        }

        // 2. Ensure User 'admin@example.com' exists
        let user = await User.findOne({ where: { email: 'admin@example.com' } });
        if (!user) {
            console.log('Creating User: admin@example.com');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            user = await User.create({
                tenantId: tenant.id,
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'active'
            }, { transaction: t });
        } else {
            console.log('User admin@example.com already exists.');
            // Optional: Reset password if it exists but user can't login?
            // For now, assume if exists, it's fine. 
            // Better: update password just in case.
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash('admin123', salt);
            user.tenantId = tenant.id; // Ensure link is correct
            await user.save({ transaction: t });
            console.log('Reset password for admin@example.com to admin123');
        }

        await t.commit();
        console.log('Fix applied successfully.');

    } catch (e) {
        await t.rollback();
        console.error('FIX FAILED:', e);
    } finally {
        await sequelize.close();
    }
};

fix();
