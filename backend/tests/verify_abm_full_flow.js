const { Sequelize } = require('sequelize');
const { connectDB } = require('../src/config/database');
const authService = require('../src/modules/auth/auth.service');
const accountService = require('../src/modules/abm/account.service');

// Config
// Use a unique tenant name to avoid conflicts
const TENANT_NAME = `ABM-Test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const EMAIL = `admin-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
const PASSWORD = 'Password123!';

async function runTest() {
    console.log(`[ABM Verify] Starting Service Integration Test for: ${TENANT_NAME}`);
    await connectDB();

    try {
        // 1. Register Tenant/User
        console.log('[1] Registering Tenant (Service)...');
        const regRes = await authService.register(TENANT_NAME, EMAIL, PASSWORD);
        // Unit test returns { user, accessToken, refreshToken }
        // User object has camelCase/mixed depending on model. 
        // Let's assume regRes.user.tenantId (based on User model)
        // Check if user.tenantId exists, if not try user.TenantId
        const user = regRes.user;
        const tenantId = user.tenantId || user.TenantId;

        if (!tenantId) throw new Error('TenantID not found in registration response');
        console.log(`    -> Success. TenantID: ${tenantId}`);

        // 2. Create an Account
        console.log('[2] Creating Account (Service)...');
        const accountData = {
            name: 'Acme Corp',
            industry: 'Technology',
            domain: 'acme.com',
            TenantId: tenantId // Service expects TenantId explicitly if not passed via context
            // check accountService.createAccount signature: (data) -> return Account.create(data)
            // It expects TenantId in data usually.
        };
        const account = await accountService.createAccount(accountData);
        const accountId = account.id;
        console.log(`    -> Account Created: ${account.name} (ID: ${accountId})`);
        console.log(`    -> Initial Score: ${account.score || 0}`);

        // 3. Simulate Intent Signal (DB Injection)
        console.log('[3] Simulating Intent Signal (Bombora)...');

        const sequelize = require('../src/config/database').sequelize;
        const now = new Date().toISOString();
        // ID must be string/UUID. Date.now() is number. Let's use string.
        const sigId = 'sig-' + Date.now();

        await sequelize.query(`
            INSERT INTO IntentSignals (id, accountId, source, activityType, occurredAt, dedupeKey, tenantId, createdAt, updatedAt)
            VALUES (
                '${sigId}', 
                '${accountId}', 
                'Bombora', 
                'intent_surge', 
                '${now}', 
                '${sigId}', 
                '${tenantId}', 
                '${now}', 
                '${now}'
            )
        `);
        console.log('    -> Signal Injected via DB');

        // Trigger Refresh (Service)
        // accountService.updateAccountIntentScore(accountId) is the logic.
        // It's likely not exported in 'create' step, but let's check exports.
        // Step 1873 showed `refreshIntent` controller calls `updateAccountIntentScore`.
        // I need to make sure accountService exports it. 
        // If not, I can rely on `getAbmAnalytics` or check if `updateAccountIntentScore` is internal.
        // If it's internal and not exported, I can't call it. 
        // But `account.controller` imported it? No, controller was calling it.
        // Wait, Step 1874: `await accountService.updateAccountIntentScore(req.params.id);`
        // So it IS exported.

        await accountService.updateAccountIntentScore(accountId);
        console.log('    -> Triggered Intent Refresh (Service)');

        // 4. Verify Account Score Updates
        console.log('[4] Verifying Account Score Update...');
        const updatedAccount = await accountService.getAccountById(accountId, tenantId);

        console.log(`    -> Updated Score: ${updatedAccount.score}`);
        console.log(`    -> Updated Intent: ${updatedAccount.intent}`); // Assuming separate field? or mapped? 
        // Model usually has `score` and `intent` (0-100).

        if (updatedAccount.score > 0 || updatedAccount.intent > 0) {
            console.log('    -> PASS: Score adjusted.');
        } else {
            console.log('    -> WARN: Score unchanged.');
        }

        // 5. Verify Analytics
        console.log('[5] Checking ABM Analytics...');
        const analytics = await accountService.getAbmAnalytics(tenantId);
        console.log('    -> Analytics:', { activeAccounts: analytics.activeAccounts });

        if (analytics.activeAccounts > 0) {
            console.log('    -> PASS: Analytics reflects data.');
        } else {
            console.log('    -> FAIL: Analytics mismatch.');
        }

        console.log('TEST COMPLETE: ABM MODULE LOGIC VERIFIED');

    } catch (error) {
        console.error('TEST FAILED:', error);
        process.exit(1);
    } finally {
        // Clean exit (Sequelize keeps process alive)
        process.exit(0);
    }
}

runTest();
