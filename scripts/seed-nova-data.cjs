const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const Account = require('../backend/src/modules/abm/account.model');
const Contact = require('../backend/src/modules/contacts/contact.model');

const NOVA_SLUG = 'nova';

const ACCOUNT_DATA = [
    { name: 'TechFlow Systems', domain: 'techflow.io', industry: 'Software', tier: 'Tier 1', country: 'USA', intentScore: 85 },
    { name: 'Innosphere Labs', domain: 'innosphere.net', industry: 'Biotech', tier: 'Tier 2', country: 'Germany', intentScore: 60 },
    { name: 'DataVantage Corp', domain: 'datavantage.com', industry: 'Analytics', tier: 'Tier 1', country: 'UK', intentScore: 92 },
    { name: 'CloudScale Solutions', domain: 'cloudscale.aws', industry: 'Cloud Infrastructure', tier: 'Tier 3', country: 'Canada', intentScore: 45 },
    { name: 'Nebula Innovations', domain: 'nebula.space', industry: 'Aerospace', tier: 'Tier 2', country: 'France', intentScore: 70 }
];

const CONTACT_ROLES = [
    { first: 'James', last: 'Carter', title: 'CEO' },
    { first: 'Linda', last: 'Wei', title: 'VP Marketing' },
    { first: 'Robert', last: 'O\'Connor', title: 'CTO' },
    { first: 'Patricia', last: 'Diaz', title: 'Director of Sales' }
];

async function seedNova() {
    try {
        console.log('🌱 Nova Seeding Started...');

        // 1. Find Nova Tenant
        const nova = await Tenant.findOne({ where: { slug: NOVA_SLUG } });
        if (!nova) {
            console.error('❌ Tenant "Nova Marketing" (nova) not found. Please run valid initial seed first.');
            process.exit(1);
        }
        console.log(`🏢 Found Tenant: ${nova.name} (ID: ${nova.id})`);

        let accountCount = 0;
        let contactCount = 0;

        // 2. Create Accounts
        for (const accData of ACCOUNT_DATA) {
            // Check if exists to avoid duplicates if run multiple times, or force create? 
            // Let's use create for simplicity as we want fresh data, or findOrCreate.
            // Using findOrCreate to be safe.
            const [account] = await Account.findOrCreate({
                where: { name: accData.name, TenantId: nova.id },
                defaults: {
                    ...accData,
                    TenantId: nova.id
                }
            });

            console.log(`   building account: ${account.name} (ID: ${account.id})`);
            accountCount++;

            // 3. Create Contacts for this Account
            for (const role of CONTACT_ROLES) {
                const email = `${role.first.toLowerCase()}.${role.last.toLowerCase()}@${account.domain}`;

                const [contact] = await Contact.findOrCreate({
                    where: { email: email, TenantId: nova.id },
                    defaults: {
                        firstName: role.first,
                        lastName: role.last,
                        email: email,
                        phone: '555-0100',
                        tags: [role.title, accData.industry], // Tags for Segmentation
                        TenantId: nova.id,
                        AccountId: account.id
                    }
                });

                // If it already existed, ensure it has the AccountId (fixer logic)
                if (contact.AccountId !== account.id) {
                    await contact.update({ AccountId: account.id });
                }

                console.log(`      👤 Contact: ${contact.email} [${role.title}]`);
                contactCount++;
            }
        }

        console.log('✅ Seeding Complete.');
        console.log(`📊 Summary: ${accountCount} Accounts, ${contactCount} Contacts created for ${nova.name}.`);
        process.exit(0);

    } catch (e) {
        console.error('❌ Seeding Failed:', e);
        process.exit(1);
    }
}

seedNova();
