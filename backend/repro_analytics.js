// Native fetch

async function checkAnalytics() {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.data?.accessToken;

        // 2. Create Account with NEW Source
        const uniqueSource = 'ZoomInfo_' + Date.now();
        console.log('Creating Account with source:', uniqueSource);
        await fetch('http://localhost:3001/api/abm/accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Analytics Test ' + Date.now(),
                intentSources: [uniqueSource], // New dynamic source
                tier: 'Tier 1'
            })
        });

        // 3. Fetch Analytics
        const res = await fetch('http://localhost:3001/api/abm/accounts/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // 4. Verify Source Exists
        const sources = data.data.signalsBySource || [];
        console.log('Sources found:', JSON.stringify(sources));

        const found = sources.find(s => s.source === uniqueSource);
        if (found) {
            console.log('SUCCESS: Dynamic source found in analytics.');
        } else {
            console.log('FAILURE: Source not found.');
        }

    } catch (e) {
        console.error(e);
    }
}
if (!global.fetch) global.fetch = require('node-fetch');
checkAnalytics();
