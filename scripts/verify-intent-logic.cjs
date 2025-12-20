const { sequelize } = require('../backend/src/config/database');
const Account = require('../backend/src/modules/abm/account.model');
const IntentSignal = require('../backend/src/modules/abm/intent_signal.model');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const { updateAccountIntentData } = require('../backend/src/modules/abm/account.service');

async function verifyLogic() {
    try {
        await sequelize.authenticate();

        // Manual Schema Patch for SQLite safety
        try {
            await sequelize.query(`ALTER TABLE Accounts ADD COLUMN intentTrend TEXT DEFAULT 'Stable';`);
            console.log('Added intentTrend column');
        } catch (e) { } // Ignore if exists

        try {
            await sequelize.query(`ALTER TABLE Accounts ADD COLUMN intentSources TEXT DEFAULT '[]';`);
            console.log('Added intentSources column');
        } catch (e) { }

        console.log('DB Connected & Patched.');

        // 1. Setup Tenant (Find existing to avoid unique constraints flaky failures)
        let tenant = await Tenant.findOne();
        if (!tenant) {
            const rnd = Math.random().toString(36).substring(7);
            const uniqueSlug = `logic-${Date.now()}-${rnd}`;
            console.log(`Creating Backup Tenant: ${uniqueSlug}`);
            tenant = await Tenant.create({
                name: 'LogicTest_' + rnd,
                domain: `test-${rnd}.com`,
                slug: uniqueSlug
            });
        }
        console.log('Using Tenant:', tenant.id);

        // 2. Setup Account
        const acc = await Account.create({
            name: 'Trend Corp',
            TenantId: tenant.id
        });

        // 3. Scenario: Rising Trend
        // Current Window (0-7d): 20 signals
        // Previous Window (7-14d): 5 signals
        const now = new Date();
        const sources = ['LinkedIn', 'G2'];

        console.log('Seeding signals...');
        for (let i = 0; i < 20; i++) {
            await IntentSignal.create({
                tenantId: tenant.id,
                accountId: acc.id,
                source: sources[i % 2],
                activityType: 'test',
                dedupeKey: `logic_${Math.random()}`,
                occurredAt: new Date(now.getTime() - 1000 * 60) // 1 min ago
            });
        }
        for (let i = 0; i < 5; i++) {
            await IntentSignal.create({
                tenantId: tenant.id,
                accountId: acc.id,
                source: 'Email',
                activityType: 'test',
                dedupeKey: `logic_old_${Math.random()}`,
                occurredAt: new Date(now.getTime() - 8 * 24 * 3600 * 1000) // 8 days ago
            });
        }

        // 4. Run Aggregation
        console.log('Running Aggregator...');
        await updateAccountIntentData(acc.id, tenant.id);

        // 5. Verify
        const updatedAcc = await Account.findByPk(acc.id);
        console.log('Updated Account:', {
            id: updatedAcc.id,
            score: updatedAcc.intentScore,
            trend: updatedAcc.intentTrend,
            sources: updatedAcc.intentSources
        });

        if (updatedAcc.intentTrend !== 'Rising') throw new Error(`Trend verification failed. Got ${updatedAcc.intentTrend}`);
        if (updatedAcc.intentScore <= 0) throw new Error(`Score verification failed. Got ${updatedAcc.intentScore}`);
        // JSON parsing might be needed if using SQLite without JSON extension automatic parsing? 
        // Sequelize usually handles it.
        if (typeof updatedAcc.intentSources === 'string') {
            updatedAcc.intentSources = JSON.parse(updatedAcc.intentSources);
        }
        if (!updatedAcc.intentSources.includes('LinkedIn')) throw new Error('Sources verification failed');

        console.log('LOGIC VERIFICATION PASSED');
        process.exit(0);

    } catch (e) {
        console.error('Logic verification failed', e);
        process.exit(1);
    }
}

verifyLogic();
