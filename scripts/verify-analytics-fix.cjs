const { sequelize } = require('../backend/src/config/database');
const Account = require('../backend/src/modules/abm/account.model');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const { getAbmAnalytics } = require('../backend/src/modules/abm/account.service');

async function verifyAnalytics() {
    try {
        await sequelize.authenticate();
        try { await sequelize.query(`ALTER TABLE Accounts ADD COLUMN intentTrend TEXT DEFAULT 'Stable';`); } catch (e) { }
        try { await sequelize.query(`ALTER TABLE Accounts ADD COLUMN intentSources TEXT DEFAULT '[]';`); } catch (e) { }

        console.log('DB Connected.');

        // 1. Setup Tenant (Find existing)
        let tenant = await Tenant.findOne();
        if (!tenant) {
            const rnd = Math.random().toString(36).substring(7);
            tenant = await Tenant.create({
                name: 'AnalyticsTest_' + rnd,
                domain: `test-${rnd}.com`,
                slug: `analytics-${Date.now()}-${rnd}`
            });
        }
        console.log('Using Tenant:', tenant.id);

        // 2. Create a T1 Account
        await Account.create({
            name: 'Generic Corp',
            TenantId: tenant.id,
            tier: 'Tier 1',
            intentScore: 50,
            status: 'Active'
        });

        // 3. Call Analytics Service
        console.log('Fetching Analytics...');
        const stats = await getAbmAnalytics(tenant.id);

        console.log('Analytics Result:', JSON.stringify(stats, null, 2));

        // 4. Verify
        if (stats.t1Accounts === undefined) throw new Error('t1Accounts property missing');
        // We just created one, so it should be >= 1. 
        // Note: verify script runs alongside existing data, so count >= 1 is safe.
        if (stats.t1Accounts < 1) throw new Error(`t1Accounts should be >= 1, got ${stats.t1Accounts}`);

        console.log('ANALYTICS VERIFICATION PASSED');
        process.exit(0);

    } catch (e) {
        console.error('Analytics verification failed', e);
        process.exit(1);
    }
}

verifyAnalytics();
