// Native fetch used

async function debugLogin() {
    try {
        console.log('Attempting login...');
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantSlug: 'demo-corp',
                email: 'admin@demo-corp.com',
                password: 'Password123!'
            })
        });

        console.log('Status:', res.status);
        const data = await res.json();

        // Write to file to avoid truncation
        const fs = require('fs');
        fs.writeFileSync('login_error.json', JSON.stringify(data, null, 2));
        console.log('Response saved to login_error.json');

    } catch (e) {
        console.error('Script Error:', e);
    }
}

// Handle native fetch if node-fetch missing
if (!global.fetch) {
    console.log('Using native fetch');
}

debugLogin();
