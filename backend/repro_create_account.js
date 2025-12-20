const { sequelize, connectDB } = require('./src/config/database');
const accountService = require('./src/modules/abm/account.service');
const Tenant = require('./src/modules/auth/tenant.model');

async function reproCreate() {
    try {
        await connectDB();
        // await sequelize.authenticate(); // handled by connectDB

        // Need a tenant context
        const tenant = await Tenant.findOne({ where: { slug: 'demo-corp' } });
        if (!tenant) throw new Error('Tenant not found');

        console.log('Attempting to create account...');
        const newAccount = await accountService.createAccount({
            name: 'Test Creation Inc',
            domain: 'testcreation.com',
            tier: 'Tier 1',
            industry: 'Debugging',
            intentSources: ['Website', 'LinkedIn'],
            TenantId: tenant.id
        });

        console.log('Account created successfully:', newAccount.id);

    } catch (e) {
        console.error('CREATION FAILED CODE:', e.original && e.original.code);
        console.error('Full Error:', e);
    } finally {
        process.exit();
    }
}

reproCreate();
