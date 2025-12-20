const { login } = require('./utils/login-utils.cjs');

async function verifyAnalyticsApi() {
    try {
        console.log('Authenticating...');
        const token = await login();
        console.log('Token acquired.');

        const url = 'http://127.0.0.1:3000/api/abm/accounts/analytics';
        console.log(`Fetching ${url}...`);

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', JSON.stringify(data, null, 2));

        if (res.status === 200 && data.data && data.data.t1Accounts !== undefined) {
            console.log('ANALYTICS API VERIFIED SUCCESS');
        } else {
            console.error('Unexpected response structure');
            process.exit(1);
        }

    } catch (e) {
        console.error('API Verification Failed:', e);
        process.exit(1);
    }
}

verifyAnalyticsApi();
