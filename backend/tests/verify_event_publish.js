const fetch = require('node-fetch');

async function verifyPublish() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.data?.accessToken;

        console.log('2. Creating "Published" Event...');
        // Frontend sends: name, type, date, speaker, duration
        // Service defaults status to 'Published' if active.
        const eventPayload = {
            name: "Grand Launch 2025",
            type: "Conference",
            startDate: new Date(Date.now() + 86400000).toISOString(), // Future
            speaker: "CEO John",
            duration: 120
        };

        const createRes = await fetch('http://localhost:3001/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ...eventPayload,
                status: 'Published' // Explicitly sending what we expect service to map
            })
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create failed: ${createRes.status} ${err}`);
        }

        const createData = await createRes.json();
        console.log('   Event Created:', createData.data.name);
        console.log('   Status:', createData.data.status);

        if (createData.data.status !== 'Published') {
            throw new Error(`Expected status 'Published', got '${createData.data.status}'`);
        }

        console.log('3. Verifying Persistence...');
        const listRes = await fetch('http://localhost:3001/api/events', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await listRes.json();
        const found = listData.data.find(e => e.id === createData.data.id);

        if (found && found.status === 'Published') {
            console.log('SUCCESS: Event saved and published correctly.');
        } else {
            console.log('FAILURE: Event not found or wrong status.');
        }

    } catch (e) {
        console.error('VERIFICATION FAILED:', e);
    }
}

// Node < 18 compat
if (!global.fetch) global.fetch = require('node-fetch');

verifyPublish();
