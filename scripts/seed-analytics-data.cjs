const { sequelize } = require('../backend/src/config/database');
const Account = require('../backend/src/modules/abm/account.model');
const IntentSignal = require('../backend/src/modules/abm/intent_signal.model');
const Tenant = require('../backend/src/modules/auth/tenant.model');

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Get All Tenants (to ensure we cover the user's login)
        const tenants = await Tenant.findAll();
        if (tenants.length === 0) {
            console.log('No tenants found. Creating default tenant...');
            const t = await Tenant.create({
                name: 'Demo Corp',
                domain: 'demo.com',
                slug: 'demo-corp'
            });
            tenants.push(t);
        }

        console.log(`Found ${tenants.length} tenants. Seeding data for each...`);

        const SOURCES = ['LinkedIn', 'Website', 'G2', 'Bombora', 'Email'];
        const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
        const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'];

        for (const tenant of tenants) {
            console.log(`Seeding for Tenant: ${tenant.name} (${tenant.id})`);

            // Check if accounts exist
            const count = await Account.count({ where: { TenantId: tenant.id } });
            if (count > 5) {
                console.log('  -> Tenant already has plenty of accounts. Skipping Account creation (but will add signals).');
            } else {
                console.log('  -> Creating 20 demo accounts...');
                // Create 20 Accounts
                const accountsToCreate = [];
                for (let i = 0; i < 20; i++) {
                    const tier = TIERS[Math.floor(Math.random() * TIERS.length)];
                    const score = Math.floor(Math.random() * 100);
                    // Tier 1 usually has high score
                    const adjustedScore = tier === 'Tier 1' ? Math.max(score, 60) : score;

                    accountsToCreate.push({
                        name: `Account ${Date.now()}_${i}`,
                        domain: `company${i}.com`,
                        industry: INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)],
                        tier: tier,
                        intentScore: adjustedScore,
                        intentTrend: ['Rising', 'Stable', 'Declining'][Math.floor(Math.random() * 3)],
                        revenue: Math.floor(Math.random() * 500) + 10, // Millions
                        status: 'Active',
                        TenantId: tenant.id
                    });
                }
                await Account.bulkCreate(accountsToCreate);
            }

            // Refresh Accounts list
            const accounts = await Account.findAll({ where: { TenantId: tenant.id } });

            // Create Intent Signals for these accounts
            console.log('  -> Creating Intent Signals...');
            const signals = [];
            const now = new Date();

            for (const acc of accounts) {
                // Number of signals based on score
                const signalCount = Math.floor(acc.intentScore / 5);

                for (let k = 0; k < signalCount; k++) {
                    const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
                    // Random date within last 30 days
                    const date = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

                    signals.push({
                        accountId: acc.id,
                        activityType: 'visit', // generic
                        source: source,
                        score: 10,
                        occurredAt: date,
                        dedupeKey: `${acc.id}_${source}_${date.getTime()}_${k}`,
                        tenantId: tenant.id
                    });
                }
            }

            // Bulk create signals (might fail on dupes, use ignoreDuplicates if possible or try/catch)
            // SQLite might not support updateOnDuplicate in older versions, but let's try standard create.
            // Using chunks to be safe
            if (signals.length > 0) {
                await IntentSignal.bulkCreate(signals, { ignoreDuplicates: true });
                console.log(`  -> Added ${signals.length} signals.`);
            }
        }

        console.log('SEEDING COMPLETE. Refresh the Analytics Dashboard.');
        process.exit(0);

    } catch (e) {
        console.error('Seeding failed', e);
        process.exit(1);
    }
}

seedData();
