async function login() {
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantSlug: 'demo-corp',
                email: 'admin@demo-corp.com',
                password: 'Password123!'
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Body:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Request Failed:', e.message);
    }
}

login();
