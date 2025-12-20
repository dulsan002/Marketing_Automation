// Native fetch in Node 18+

async function reproHttp() {
    try {
        // 1. Login to get token
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' })
        });
        console.log('Login Status:', loginRes.status);
        const loginData = await loginRes.json();
        console.log('Login Body:', JSON.stringify(loginData));

        if (!loginRes.ok) throw new Error('Login failed');
        const token = loginData.data && loginData.data.token;

        // 2. Create Account
        const payload = {
            name: 'Http Repro Corp',
            domain: 'httprepro.com',
            industry: 'Debugging',
            tier: 'Tier 1', // sending valid mapped value
            intentSources: ['Website']
        };

        const res = await fetch('http://localhost:3001/api/abm/accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        console.log('Create Status:', res.status);
        const data = await res.json();
        console.log('Body:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

reproHttp();
