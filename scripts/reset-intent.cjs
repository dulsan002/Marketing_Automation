const { sequelize } = require('../backend/src/config/database');
const IntentSignal = require('../backend/src/modules/abm/intent_signal.model');
const Account = require('../backend/src/modules/abm/account.model');
// Removed faker dependency
// I'll stick to simple random generation to avoid dependencies if faker isn't there.

async function resetIntent() {
    try {
        console.log('🧹 Clearing all Intent Signals...');
        await IntentSignal.destroy({ where: {}, truncate: true });

        console.log('🌱 Reseeding Intent Signals (Single Pass)...');
        const accounts = await Account.findAll();

        for (const account of accounts) {
            // 3-5 signals per account
            const count = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < count; i++) {
                await IntentSignal.create({
                    tenantId: account.TenantId,
                    accountId: account.id,
                    source: ['Bombora', 'LinkedIn', ' G2 Crowd', 'Website'][Math.floor(Math.random() * 4)],
                    signalType: ['Surging Interest', 'Competitor Research', 'Pricing Page Visit', 'Whitepaper Download'][Math.floor(Math.random() * 4)],
                    weight: Math.floor(Math.random() * 50) + 50,
                    payload: { topic: 'Marketing Automation' },
                    occurredAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000))
                });
            }
        }

        console.log('✅ Intent Signals Reset Complete.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed:', e);
        process.exit(1);
    }
}

resetIntent();
