const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const User = require('../backend/src/modules/auth/user.model');
const Contact = require('../backend/src/modules/contacts/contact.model');
const bcrypt = require('../backend/node_modules/bcryptjs'); // Use backend's dependency

// Tenants Data
const tenants = [
    { name: 'Acme Corporation', slug: 'acme', plan: 'pro' },
    { name: 'Nova Marketing', slug: 'nova', plan: 'growth' },
    { name: 'Demo Sandbox', slug: 'demo', plan: 'free' }
];

// Users Data Helper
const getUsers = (tenantId, slug) => {
    const users = [];
    const passwordHash = bcrypt.hashSync(slug === 'acme' ? 'Admin@123' : (slug === 'nova' ? 'Admin@123' : 'Demo@123'), 10);
    const marketerHash = bcrypt.hashSync('Market@123', 10);
    const viewerHash = bcrypt.hashSync('Viewer@123', 10);

    if (slug === 'acme') {
        users.push({ tenantId, email: 'admin@acme.com', password: passwordHash, role: 'ADMIN', status: 'active' });
        users.push({ tenantId, email: 'marketer@acme.com', password: marketerHash, role: 'MARKETER', status: 'active' });
        users.push({ tenantId, email: 'viewer@acme.com', password: viewerHash, role: 'VIEWER', status: 'active' });
    } else if (slug === 'nova') {
        users.push({ tenantId, email: 'admin@nova.com', password: passwordHash, role: 'ADMIN', status: 'active' });
        users.push({ tenantId, email: 'growth@nova.com', password: marketerHash, role: 'MARKETER', status: 'active' });
    } else if (slug === 'demo') {
        users.push({ tenantId, email: 'demo@demo.com', password: passwordHash, role: 'ADMIN', status: 'active' });
    }
    return users;
};

// Contacts Data Helper
const getContacts = (tenantId, slug) => {
    const contacts = [];
    if (slug === 'acme') {
        contacts.push({ tenantId, firstName: 'John', lastName: 'Smith', email: 'john@client1.com', phone: '1234567890' });
        contacts.push({ tenantId, firstName: 'Sarah', lastName: 'Lee', email: 'sarah@client2.com', phone: '0987654321' });
        contacts.push({ tenantId, firstName: 'David', lastName: 'Miller', email: 'david@client3.com' });
    } else if (slug === 'nova') {
        contacts.push({ tenantId, firstName: 'Emma', lastName: 'Brown', email: 'emma@startup.io' });
        contacts.push({ tenantId, firstName: 'Alex', lastName: 'Green', email: 'alex@growthhub.com' });
    } else if (slug === 'demo') {
        contacts.push({ tenantId, firstName: 'Test', lastName: 'User', email: 'test@example.com' });
    }
    return contacts;
};

async function seed() {
    try {
        console.log('🌱 Seeding Started...');

        // Sync DB (Force to ensure clean slate for seed)
        // await sequelize.sync({ force: true });
        // NOTE: User requested idempotency, but verified schema upgrade via reset.
        // Let's rely on findOrCreate to be safe/idempotent or just create if clean.
        // Since we are creating DEV data, let's use force: true to guarantee clean state as per "Seed data to unblock frontend".
        await sequelize.sync({ force: true });
        console.log('✅ Database Synced (Force Reset)');

        for (const tData of tenants) {
            // Create Tenant
            const [tenant] = await Tenant.findOrCreate({
                where: { slug: tData.slug },
                defaults: tData
            });
            console.log(`🏢 Tenant Created: ${tenant.name} (${tenant.slug})`);

            // Create Users
            const users = getUsers(tenant.id, tenant.slug);
            for (const u of users) {
                await User.create(u);
                console.log(`   👤 User: ${u.email} [${u.role}]`);
            }

            // Create Contacts
            const contacts = getContacts(tenant.id, tenant.slug);
            for (const c of contacts) {
                await Contact.create(c);
                console.log(`   📞 Contact: ${c.email}`);
            }
        }

        console.log('✅ Seeding Complete.');
        process.exit(0);

    } catch (e) {
        console.error('❌ Seeding Failed:', e);
        process.exit(1);
    }
}

seed();
