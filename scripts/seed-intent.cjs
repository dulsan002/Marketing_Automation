const { sequelize } = require('../backend/src/config/database');
const Account = require('../backend/src/modules/abm/account.model');
const IntentSignal = require('../backend/src/modules/abm/intent_signal.model');
const Tenant = require('../backend/src/modules/auth/tenant.model');

const SIGNALS = [
    { type: 'Pricing Page Visit', source: 'Website', weight: 10 },
    { type: 'G2 Review Read', source: 'G2', weight: 20 },
    { type: 'Webinar Attended', source: 'Zoom', weight: 30 },
    { type: 'Whitepaper Download', source: 'Website', weight: 15 },
    { type: 'LinkedIn Ad Click', source: 'LinkedIn', weight: 5 }
];

async function seedIntent() {
    try {
        console.log('📡 Seeding Intent Signals...');
        // Force Sync IntentSignal table to be sure
        await IntentSignal.sync({ alter: true });

        const accounts = await Account.findAll({ include: [Tenant] });

        for (const acc of accounts) {
            console.log(` Generating signals for ${acc.name}...`);
            const numSignals = Math.floor(Math.random() * 5) + 2; // 2-7 signals each

            for (let i = 0; i < numSignals; i++) {
                const sig = SIGNALS[Math.floor(Math.random() * SIGNALS.length)];
                await IntentSignal.create({
                    accountId: acc.id,
                    tenantId: acc.TenantId,
                    contactId: null, // Anonymous for now, or link to contact if needed
                    source: sig.source,
                    signalType: sig.type,
                    weight: sig.weight,
                    occurredAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000))
                });
            }
        }
        console.log('✅ Intent Signals Seeded.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seedIntent();
