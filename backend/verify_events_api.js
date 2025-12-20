const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function verify() {
    try {
        console.log('🔑 Logging in...');
        const loginRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify({ tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' }))
            }
        }, { tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' });

        if (loginRes.statusCode !== 200) {
            console.log('❌ Login failed:', loginRes.body);
            return;
        }

        const token = loginRes.body.data.accessToken;
        console.log('✅ Login successful. Token:', token ? 'Found' : 'MISSING');
        // console.log('Full Login Body:', JSON.stringify(loginRes.body, null, 2));

        console.log('📅 Fetching events...');
        const eventsRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/events',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`✅ Events API Status: ${eventsRes.statusCode}`);
        if (eventsRes.statusCode !== 200) {
            console.log('❌ API Error Body:', JSON.stringify(eventsRes.body, null, 2));
        }
        console.log(`📊 Events Found: ${eventsRes.body.data ? eventsRes.body.data.length : 0}`);

        if (eventsRes.body.data && eventsRes.body.data.length > 0) {
            console.log('🔎 First Event Sample:', JSON.stringify(eventsRes.body.data[0], null, 2));
        }

    } catch (e) {
        console.error('❌ Verification failed:', e.message);
    }
}

verify();
