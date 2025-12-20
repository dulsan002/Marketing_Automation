const API_URL = 'http://localhost:3001/api';
let authToken;

async function setupAuth() {
    const timestamp = Date.now();
    const testEmail = `admin-analytics-${timestamp}@test.com`;
    const testPassword = 'password123';
    const testTenant = `Tenant Analytics ${timestamp}`;

    console.log('\n0. Setting up Auth for Analytics Test...');
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantName: testTenant,
                email: testEmail,
                password: testPassword
            })
        });

        const body = await res.json();
        if (!res.ok) throw new Error(body.message || res.statusText);

        if (body.data && body.data.accessToken) {
            authToken = body.data.accessToken;
            console.log('✓ Account registered');
        } else {
            throw new Error('No token received');
        }

    } catch (error) {
        console.error('Auth setup failed', error.message);
        process.exit(1);
    }
}

async function createAccount(name, tier, revenue, intentScore) {
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };

    await fetch(`${API_URL}/abm/accounts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name,
            domain: name.toLowerCase().replace(' ', '') + '.com',
            industry: 'Tech',
            tier,
            revenue,
            employees: 100,

            // Note: intentScore is usually calculated, but let's see if we can seed it via DB or activity?
            // Service creates account with default intent 0.
            // We might need to manually update it via DB or mock activity if we want to test ranking?
            // For now, let's create them and check basic stats. topAccounts might rely on default sort logic if scores are 0.
        })
    });
}

async function runTest() {
    await setupAuth();

    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };

    console.log('\n1. Seeding Data...');
    try {
        // 3 T1 accounts, 2 T2 accounts, revenue sum check
        await createAccount('Acme Corp', 'Tier 1', 10, 0); // Active
        await createAccount('Beta Inc', 'Tier 1', 20, 0);  // Active
        await createAccount('Gamma LLC', 'Tier 1', 5, 0);  // Active
        await createAccount('Delta Co', 'Tier 2', 15, 0);  // Active
        await createAccount('Epsilon', 'Tier 2', 50, 0);   // Active

        console.log('✓ Created 5 accounts. Expected Revenue Sum: 100M');
    } catch (e) {
        console.error('Failed to seed', e.message);
    }

    console.log('\n2. Fetching Analytics...');
    try {
        const res = await fetch(`${API_URL}/abm/analytics`, { headers });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message);

        const d = body.data;
        console.log('Received Data:', JSON.stringify(d, null, 2));

        // Verify Active Accounts
        if (d.activeAccounts === 5) console.log('✓ Active Accounts: Correct (5)');
        else console.error(`✗ Active Accounts: Expected 5, got ${d.activeAccounts}`);

        // Verify Pipeline Value
        if (d.pipelineValue === 100) console.log('✓ Pipeline Value: Correct (100)');
        else console.error(`✗ Pipeline Value: Expected 100, got ${d.pipelineValue}`);

        // Verify Tiers
        const t1 = d.accountTiers.find(t => t.tier === 'T1');
        const t2 = d.accountTiers.find(t => t.tier === 'T2');

        if (t1 && t1.count === 3) console.log('✓ T1 Count: Correct (3)');
        else console.error(`✗ T1 Count: Expected 3, got ${t1?.count}`);

        if (t2 && t2.count === 2) console.log('✓ T2 Count: Correct (2)');
        else console.error(`✗ T2 Count: Expected 2, got ${t2?.count}`);

    } catch (e) {
        console.error('Analytics Fetch Failed', e.message);
    }
}

runTest();
