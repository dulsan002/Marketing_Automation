// Native fetch

async function reproSources() {
    try {
        console.log('Login...');
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.data?.accessToken;
        if (!token) {
            console.log('Login Response:', JSON.stringify(loginData, null, 2));
            throw new Error('Login failed');
        }

        console.log('Creating Account with [G2, LinkedIn]...');
        const res = await fetch('http://localhost:3001/api/abm/accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Source Test Corp ' + Date.now(),
                domain: 'sourcetest.com',
                industry: 'Tech',
                tier: 'Tier 1',
                intentSources: ['G2', 'LinkedIn']
            })
        });

        const data = await res.json();
        console.log('Create Status:', res.status);
        if (res.ok) {
            console.log('Returned Intent Sources:', JSON.stringify(data.data.intentSources));
        } else {
            console.log('Error:', JSON.stringify(data));
        }

    } catch (e) {
        console.error(e);
    }
}

// Simple fetch shim if needed, or rely on Node 22 native
if (!global.fetch) global.fetch = require('node-fetch');

reproSources();
