const http = require('http');

const TOKEN_PAYLOAD = { tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' };
let TOKEN = '';
let EVENT_ID = '';

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        if (data) {
            const body = JSON.stringify(data);
            req.setHeader('Content-Length', Buffer.byteLength(body));
            req.write(body);
        }
        req.end();
    });
}

async function verify() {
    try {
        console.log('🔑 Logging in...');
        const loginRes = await request({
            hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, TOKEN_PAYLOAD);

        if (loginRes.statusCode !== 200) throw new Error('Login failed');
        TOKEN = loginRes.body.data.accessToken;
        console.log('✅ Login successful.');

        console.log('📅 Creating Test Event...');
        const createRes = await request({
            hostname: 'localhost', port: 3001, path: '/api/events', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` }
        }, {
            name: 'Registration Test Event',
            type: 'Webinar',
            startDate: new Date().toISOString(),
            collectCompany: true,
            collectJobTitle: true
        });

        if (createRes.statusCode !== 201) throw new Error('Create Event failed: ' + JSON.stringify(createRes.body));
        EVENT_ID = createRes.body.data.id;
        console.log('✅ Event Created:', EVENT_ID);

        console.log('📝 Registering User (Manual)...');
        const regRes = await request({
            hostname: 'localhost', port: 3001, path: `/api/events/${EVENT_ID}/register`, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` }
        }, {
            firstName: 'Test',
            lastName: 'Registrant',
            email: `test_${Date.now()}@example.com`,
            company: 'Test Corp',
            jobTitle: 'Tester'
        });

        if (regRes.statusCode !== 200) throw new Error('Registration failed: ' + JSON.stringify(regRes.body));
        console.log('✅ Registration Successful.');

        console.log('🔎 Verifying Registration List...');
        const listRes = await request({
            hostname: 'localhost', port: 3001, path: `/api/events/${EVENT_ID}/registrations`, method: 'GET',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const registrant = listRes.body.data.find(r => r.Contact.email.includes('test_'));
        if (registrant) {
            console.log('✅ Found Registrant:', registrant.Contact.email, 'Status:', registrant.status);
        } else {
            console.error('❌ Registrant NOT found in list!');
            console.log('List:', JSON.stringify(listRes.body.data, null, 2));
        }

    } catch (e) {
        console.error('❌ Verification Failed:', e.message);
    }
}

verify();
