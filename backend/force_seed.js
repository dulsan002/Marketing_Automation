const { sequelize } = require('./src/config/database');
const Tenant = require('./src/modules/auth/tenant.model');
const User = require('./src/modules/auth/user.model');
const Account = require('./src/modules/abm/account.model');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function forceSeed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // 1. Create Tenant
        console.log('Creating Tenant...');
        const [tenant, created] = await Tenant.findOrCreate({
            where: { slug: 'acme' },
            defaults: {
                name: 'Acme Corporation',
                status: 'active',
                plan: 'pro'
            }
        });
        console.log(`Tenant created: ${tenant.name} (${tenant.id})`);

        // 2. Create User
        console.log('Creating User...');
        const passwordHash = await bcrypt.hash('Admin@123', 10);
        await User.findOrCreate({
            where: { email: 'admin@acme.com' },
            defaults: {
                tenantId: tenant.id,
                password: passwordHash,
                role: 'ADMIN',
                status: 'active'
            }
        });
        console.log('User created: admin@acme.com');

        // 3. Create Account
        console.log('Creating Account...');
        await Account.create({
            name: 'Acme Corp',
            domain: 'acmecorp.com',
            industry: 'Technology',
            tier: 'Tier 1',
            country: 'USA',
            intentScore: 85,
            revenue: 1000000,
            employees: 500,
            TenantId: tenant.id,
            intentTrend: 'Increasing',
            intentSources: ['Website', 'LinkedIn'],
            normalizedName: 'acme corp'
        });
        console.log('Account created.');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

forceSeed();
