const run = async () => {
    try {
        // 1. Register to get token
        console.log('Registering...');
        const email = `debug_analytics_${Date.now()}@test.com`;
        const authRes = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: 'Password123!',
                firstName: 'Debug',
                lastName: 'User',
                tenantName: 'Debug Tenant ' + Date.now()
            })
        });
        const authData = await authRes.json();

        if (!authRes.ok) throw new Error('Auth failed: ' + JSON.stringify(authData));
        const token = authData.data.accessToken || authData.data.token || authData.token;
        console.log('Got Token.');

        // 2. Call Analytics
        console.log('Calling Analytics...');
        const res = await fetch('http://localhost:3001/api/events/analytics', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 200) {
            const data = await res.json();
            console.log('Success:', data);
        } else {
            console.log('Status:', res.status);
            const text = await res.text();
            console.log('Response Body:', text);
        }

    } catch (error) {
        console.error('Request Failed:', error.message);
    }
};

run();
