const { sequelize } = require('./src/config/database');
const { seedBaseData, seedTenants } = require('./src/common/seeder'); // Check if available
const app = require('./src/app'); // Import to load models?
// We need to make sure all models are required before sync.
// Usually app.js or server.js does this.
// Let's manually require all models to be safe.
require('./src/modules/auth/user.model');
require('./src/modules/tenants/tenant.model');
require('./src/modules/events/event.model');
require('./src/modules/abm/account.model');
require('./src/modules/abm/intent_signal.model');
require('./src/modules/contacts/contact.model');
require('./src/modules/events/registration.model');
require('./src/modules/campaigns/campaign.model');
require('./src/modules/campaigns/campaign_version.model');
require('./src/modules/segments/segment.model');
require('./src/modules/segments/segment_membership.model');
require('./src/modules/workflows/workflow.model');
require('./src/modules/workflows/workflow_campaign_ref.model');
require('./src/modules/workflows/workflow_execution.model');
require('./src/modules/system/activity_log.model');
// Add others if needed...

async function resetAndSeed() {
    try {
        console.log('Syncing database...');
        await sequelize.sync({ force: true });
        console.log('Database synced.');

        // We need a tenant and user to login.
        // Assuming seeder exists or we manually create one.
        console.log('Seeding demo tenant...');
        const Tenant = require('./src/modules/tenants/tenant.model');
        const User = require('./src/modules/auth/user.model');
        const bcrypt = require('bcryptjs');

        const tenant = await Tenant.create({
            name: 'Demo Corp',
            slug: 'demo-corp',
            plan: 'Enterprise',
            modules: JSON.stringify(['MAP', 'ABM', 'Events'])
        });

        const hashedPassword = await bcrypt.hash('Password123!', 10);
        await User.create({
            email: 'admin@demo-corp.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'Admin',
            TenantId: tenant.id
        });

        console.log('Seeding complete. Ready to restart server.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await sequelize.close();
    }
}

resetAndSeed();
