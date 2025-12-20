async function checkIntentSignals() {
    try {
        // First Login to get Token
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantSlug: 'demo-corp',
                email: 'admin@demo-corp.com',
                password: 'Password123!'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.accessToken;

        // Check Intent Signals
        const response = await fetch('http://localhost:3001/api/abm/accounts/intent-signals', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Full Data:', JSON.stringify(data.data, null, 2));
    } catch (e) {
        console.error('Request Failed:', e.message);
    }
}

checkIntentSignals();
