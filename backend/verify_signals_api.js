// Native fetch

async function checkSignals() {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        // 2. Get Signals
        const res = await fetch('http://localhost:3001/api/abm/accounts/intent-signals', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.data && data.data.length > 0) {
            console.log('First Record:', JSON.stringify(data.data[0], null, 2));
        } else {
            console.log('No data found');
        }

    } catch (e) {
        console.error(e);
    }
}
// Shim fetch
if (!global.fetch) { global.fetch = require('node-fetch'); }

checkSignals();
