const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const Account = require('../backend/src/modules/abm/account.model');
const IntentSignal = require('../backend/src/modules/abm/intent_signal.model');

// Mock Data
const SIGNAL_SOURCES = ['Bombora', 'G2', 'LinkedIn', 'Website', 'TrustRadius', 'ZoomInfo'];
const TOPICS = ['CRM', 'Data Analytics', 'Cloud Security', 'Marketing Automation', 'DevOps', 'ERP', 'HR Tech'];
const TRENDS = ['Rising', 'Flat', 'Declining'];

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedIntentSignals() {
    try {
        console.log('📡 Starting Intent Signal Seeding...');

        // 1. Fetch All Tenants
        const tenants = await Tenant.findAll();
        if (tenants.length === 0) {
            console.log('⚠️ No tenants found.');
            process.exit(0);
        }

        let totalSignals = 0;

        for (const tenant of tenants) {
            console.log(`\nProcessing Tenant: ${tenant.name}`);

            // 2. Fetch All Accounts for this Tenant
            const accounts = await Account.findAll({ where: { TenantId: tenant.id } });
            console.log(`   Found ${accounts.length} accounts.`);

            for (const acc of accounts) {
                // Check if account already has signals? Or just adding more?
                // Request says "intents signal should there", implying ensure at least one.
                const existingSignals = await IntentSignal.count({ where: { AccountId: acc.id } });

                if (existingSignals > 0) {
                    // console.log(`   - Account ${acc.name} already has ${existingSignals} signals.`);
                    // continue; // Uncomment if we only want to fill gaps. 
                    // But maybe user wants refreshing or multiple signals. 
                    // Let's ensure at least 3-5 signals per account.
                    if (existingSignals >= 3) continue;
                }

                const signalsNeeded = 3 - existingSignals;
                if (signalsNeeded > 0) {
                    console.log(`   + Adding ${signalsNeeded} signals for ${acc.name}...`);
                    for (let i = 0; i < signalsNeeded; i++) {
                        await IntentSignal.create({
                            source: getRandom(SIGNAL_SOURCES),
                            activityType: getRandom(TOPICS), // Using topics as activity type for now
                            score: Math.floor(Math.random() * 60) + 40,
                            occurredAt: new Date(),
                            tenantId: tenant.id, // Lowercase per error
                            accountId: acc.id,
                            dedupeKey: `${acc.id}-${Date.now()}-${i}-${Math.random()}`
                        });
                        totalSignals++;
                    }
                }
            }
        }

        console.log(`\n✅ Seeding Complete. Added ${totalSignals} new intent signals.`);
        process.exit(0);

    } catch (e) {
        console.error('❌ Seeding Error:', e);
        process.exit(1);
    }
}

seedIntentSignals();
