const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const Account = require('../backend/src/modules/abm/account.model');

// Data Pools
const ACME_ACCOUNTS = [
    { name: 'Globex Corp', domain: 'globex.com', industry: 'Logistics', tier: 'Tier 1', country: 'USA', intentScore: 50 },
    { name: 'Soylent Corp', domain: 'soylent.com', industry: 'Manufacturing', tier: 'Tier 2', country: 'China', intentScore: 30 },
    { name: 'Umbrella Corp', domain: 'umbrella.com', industry: 'Pharmaceuticals', tier: 'Tier 1', country: 'USA', intentScore: 95 },
    { name: 'Massive Dynamic', domain: 'massivedynamic.com', industry: 'R&D', tier: 'Tier 3', country: 'USA', intentScore: 20 }
];

const DEMO_ACCOUNTS = [
    { name: 'Stark Industries', domain: 'stark.com', industry: 'Defense', tier: 'Tier 1', country: 'USA', intentScore: 88 },
    { name: 'Wayne Enterprises', domain: 'wayne.com', industry: 'Conglomerate', tier: 'Tier 1', country: 'USA', intentScore: 75 },
    { name: 'Cyberdyne Systems', domain: 'cyberdyne.com', industry: 'Technology', tier: 'Tier 2', country: 'Japan', intentScore: 65 }
];

async function seedAll() {
    try {
        console.log('🌱 Seeding Missing Accounts...');
        const tenants = await Tenant.findAll();

        for (const t of tenants) {
            console.log(`Checking Tenant: ${t.name} (${t.slug})...`);

            let dataPool = [];
            if (t.slug === 'acme') dataPool = ACME_ACCOUNTS;
            else if (t.slug === 'demo') dataPool = DEMO_ACCOUNTS;
            else {
                console.log(`   Skipping (Already has data or no pool needed)`);
                continue;
            }

            for (const acc of dataPool) {
                await Account.findOrCreate({
                    where: { name: acc.name, TenantId: t.id },
                    defaults: {
                        ...acc,
                        TenantId: t.id,
                        employees: Math.floor(Math.random() * 5000) + 100,
                        revenue: Math.floor(Math.random() * 1000000) + 50000
                    }
                });
                console.log(`   + Account: ${acc.name}`);
            }
        }
        console.log('✅ Account Seeding Complete.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seedAll();
