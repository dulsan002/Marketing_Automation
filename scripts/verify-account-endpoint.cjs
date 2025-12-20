// Native fetch in Node 18+

async function verify() {
    try {
        console.log('🔑 Logging in as growth@nova.com...');
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'growth@nova.com', password: 'Market@123', tenantSlug: 'nova' })
        });

        if (!loginRes.ok) throw new Error(`Login Failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.data.accessToken;
        console.log('✅ Login Success. Token obtained.');

        console.log('📡 Fetching Accounts from /api/abm/accounts...');
        const accRes = await fetch('http://localhost:3001/api/abm/accounts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!accRes.ok) {
            const err = await accRes.text();
            throw new Error(`API Error: ${accRes.status} ${err}`);
        }

        const accData = await accRes.json();
        console.log('✅ API Response Status:', accData.status);
        console.log('🛡️ CORS Header:', accRes.headers.get('access-control-allow-origin'));
        console.log('📊 Account Count:', accData.data.length);
        console.log('📄 Sample Data (Fields):', JSON.stringify({
            name: accData.data[0].name,
            country: accData.data[0].country,
            intentScore: accData.data[0].intentScore
        }, null, 2));

    } catch (e) {
        console.error('❌ Test Failed:', e.message);
    }
}
verify();
