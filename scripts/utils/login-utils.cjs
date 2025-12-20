async function login() {
    const fetch = globalThis.fetch;
    const loginUrl = 'http://127.0.0.1:3000/api/auth/login';
    const registerUrl = 'http://127.0.0.1:3000/api/auth/register';

    // Try a random user to guarantee access for verification
    const randomId = Math.floor(Math.random() * 10000);
    const creds = {
        email: `verifier${randomId}@example.com`,
        password: 'password123',
        name: 'Verifier User',
        organization: 'Verification Org'
    };

    try {
        // Direct Register
        console.log(`Registering temporary user: ${creds.email}`);
        let response = await fetch(registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creds)
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { console.error('Non-JSON:', text); throw e; }

        if (response.ok && data.token) return data.token;

        throw new Error('Registration failed: ' + JSON.stringify(data));
    } catch (e) {
        console.error('Auth verification failed', e);
        throw e;
    }
}
module.exports = { login };
