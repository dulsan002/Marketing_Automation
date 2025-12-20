const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const Account = require('../backend/src/modules/abm/account.model');
const Contact = require('../backend/src/modules/contacts/contact.model');
const crypto = require('crypto');

const FIRST_NAMES = [
    'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
    'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'
];
const LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'
];
const ROLES = ['Decision Maker', 'Influencer', 'Champion', 'End-User'];

async function seedBuyingCommittees() {
    try {
        console.log('🌱 Seeding Buying Committees (5 Contacts per Account)...');
        // Ensure associations are set up in this process
        // (Models already load them, but good to be safe)

        const tenants = await Tenant.findAll();

        for (const tenant of tenants) {
            console.log(`Processing Tenant: ${tenant.name}`);
            const accounts = await Account.findAll({ where: { TenantId: tenant.id } });

            for (const account of accounts) {
                console.log(`  -> Account: ${account.name}`);

                // Check if contacts already exist to avoid over-seeding
                const count = await Contact.count({ where: { AccountId: account.id } });
                if (count >= 5) {
                    console.log(`     Already has ${count} contacts. Skiping.`);
                    continue; // Skip if already populated
                }

                const limit = 5 - count;
                for (let i = 0; i < limit; i++) {
                    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
                    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
                    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
                    const uniqueSuffix = Math.floor(Math.random() * 9000) + 1000;

                    const domain = account.domain || 'example.com';
                    const email = `${firstName}.${lastName}.${uniqueSuffix}@${domain}`.toLowerCase();

                    await Contact.create({
                        id: crypto.randomUUID(),
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        TenantId: tenant.id,
                        AccountId: account.id,
                        tags: [role], // This maps to Role in frontend
                        title: 'Manager', // Default title
                        score: Math.floor(Math.random() * 100)
                    });
                }
                console.log(`     Added ${limit} contacts.`);
            }
        }

        console.log('✅ Seeding Complete.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding Failed:', e);
        process.exit(1);
    }
}

seedBuyingCommittees();
