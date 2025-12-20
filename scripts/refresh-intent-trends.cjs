const { sequelize } = require('../backend/src/config/database');
const Account = require('../backend/src/modules/abm/account.model');
const IntentSignal = require('../backend/src/modules/abm/intent_signal.model');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const { updateAccountIntentData } = require('../backend/src/modules/abm/account.service');
// const { faker } = require('@faker-js/faker'); // Removed to fix missing dep

const seedIntent = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Get a Tenant
        const tenant = await Tenant.findOne();
        if (!tenant) throw new Error('No tenant found');
        const tenantId = tenant.id;

        // 2. Get Accounts
        const accounts = await Account.findAll({ where: { TenantId: tenantId } });
        if (accounts.length === 0) throw new Error('No accounts found');

        console.log(`Seeding intent for ${accounts.length} accounts...`);

        const now = new Date();
        const sources = ['LinkedIn', 'G2', 'Website', 'Email', 'Bombora'];

        // Helper to create signal
        const createSignal = async (accId, dateOffsetDays) => {
            const d = new Date(now.getTime() - dateOffsetDays * 24 * 60 * 60 * 1000);
            const source = sources[Math.floor(Math.random() * sources.length)];
            const dedup = `seed_${accId}_${Math.random()}`;

            await IntentSignal.create({
                tenantId,
                accountId: accId,
                source,
                activityType: 'page_visit',
                dedupeKey: dedup,
                occurredAt: d
            });
        };

        // 3. Scenario 1: Rising Account (High recent, Low previous)
        const risingAcc = accounts[0];
        console.log(`Configuring Rising Trend for: ${risingAcc.name}`);
        // Current (0-7d): 15 signals
        for (let i = 0; i < 15; i++) await createSignal(risingAcc.id, Math.random() * 7);
        // Previous (7-14d): 2 signals
        for (let i = 0; i < 2; i++) await createSignal(risingAcc.id, 7 + Math.random() * 7);

        // 4. Scenario 2: Declining Account
        if (accounts.length > 1) {
            const decliningAcc = accounts[1];
            console.log(`Configuring Declining Trend for: ${decliningAcc.name}`);
            // Current: 2 signals
            for (let i = 0; i < 2; i++) await createSignal(decliningAcc.id, Math.random() * 7);
            // Previous: 15 signals
            for (let i = 0; i < 15; i++) await createSignal(decliningAcc.id, 7 + Math.random() * 7);
        }

        // 5. Scenario 3: Stable Account
        if (accounts.length > 2) {
            const stableAcc = accounts[2];
            console.log(`Configuring Stable Trend for: ${stableAcc.name}`);
            // Current: 5
            for (let i = 0; i < 5; i++) await createSignal(stableAcc.id, Math.random() * 7);
            // Previous: 5
            for (let i = 0; i < 5; i++) await createSignal(stableAcc.id, 7 + Math.random() * 7);
        }

        // 6. Run Aggregation for All
        console.log('Running Aggregation...');
        for (const acc of accounts) {
            await updateAccountIntentData(acc.id, tenantId);
        }

        console.log('Seeding Complete.');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        process.exit();
    }
};

seedIntent();
