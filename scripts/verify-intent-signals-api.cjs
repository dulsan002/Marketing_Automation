const { login } = require('./utils/login-utils.cjs');
const { sequelize } = require('../backend/src/config/database');
const Account = require('../backend/src/modules/abm/account.model');
const IntentSignal = require('../backend/src/modules/abm/intent_signal.model');
const { updateAccountIntentData } = require('../backend/src/modules/abm/account.service');

// Manual JWT Decode (Node safe)
const decodeJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('JWT Decode Error', e);
        throw e;
    }
};

async function verifyIntentSignals() {
    try {
        // 1. Login (Create fresh tenant)
        const token = await login();
        console.log('Got Token.');

        // Decode Token to get TenantId
        const decoded = decodeJwt(token);
        const tenantId = decoded.tenantId;
        console.log('TenantID:', tenantId);

        // 2. Seed Data for this Tenant directly
        await sequelize.authenticate();

        // Create an Account
        const acc = await Account.create({
            name: 'Verification Corp',
            TenantId: tenantId,
            intentScore: 0
        });
        console.log('Created Account:', acc.name);

        // Create Signals (Rising Trend: High Current, Low Past)
        const now = new Date();
        // 10 signals in last 7 days
        for (let i = 0; i < 10; i++) {
            await IntentSignal.create({
                tenantId, accountId: acc.id, source: 'Website',
                activityType: 'visit', dedupeKey: `ver_${Math.random()}`,
                occurredAt: new Date(now.getTime() - 100000) // recent
            });
        }
        // 1 signal in 7-14 days
        await IntentSignal.create({
            tenantId, accountId: acc.id, source: 'Website',
            activityType: 'visit', dedupeKey: `ver_old_${Math.random()}`,
            occurredAt: new Date(now.getTime() - 8 * 24 * 3600 * 1000) // 8 days ago
        });

        // 3. Trigger Aggregation
        await updateAccountIntentData(acc.id, tenantId);
        console.log('Aggregation run.');

        // 4. Call API
        const response = await fetch('http://localhost:3000/api/abm/accounts/intent-signals', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`API Error: ${response.status} ${txt}`);
        }

        const signals = await response.json();
        console.log(`Fetched ${signals.length} intent summaries.`);

        if (signals.length === 0) throw new Error('No signals returned after seeding!');

        const s1 = signals[0];
        console.log('Signal Data:', JSON.stringify(s1, null, 2));

        // Verify Rising Trend
        if (s1.trend !== 'Rising') throw new Error(`Expected Rising, got ${s1.trend}`);
        if (s1.score <= 0) throw new Error('Score should be positive');

        console.log('SUCCESS: Intent Signals Verified.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verifyIntentSignals();
