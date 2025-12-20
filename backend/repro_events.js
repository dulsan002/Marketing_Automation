// Native fetch

async function reproEvents() {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantSlug: 'demo-corp', email: 'admin@demo-corp.com', password: 'Password123!' })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.data?.accessToken;

        // 2. Create Event
        console.log('Creating Event...');
        const createRes = await fetch('http://localhost:3001/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Tech Submit 2025',
                type: 'Conference',
                startDate: new Date(Date.now() + 86400000).toISOString(),
                endDate: new Date(Date.now() + 172800000).toISOString(),
                speaker: 'Elon Musk', // New field
                duration: 120, // New field,
                status: 'Published'
            })
        });
        const createData = await createRes.json();
        console.log('Create Status:', createRes.status);
        console.log('Event Created:', JSON.stringify(createData.data, null, 2));

        // 3. Get Events
        console.log('Fetching Events...');
        const listRes = await fetch('http://localhost:3001/api/events', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await listRes.json();
        console.log('Total Events:', listData.data.length);

        // Verify speaker field
        const found = listData.data.find(e => e.speaker === 'Elon Musk');
        if (found) {
            console.log('SUCCESS: Speaker field persisted correctly.');
        } else {
            console.log('FAILURE: Speaker field missing.');
        }

    } catch (e) {
        console.error(e);
    }
}
if (!global.fetch) global.fetch = require('node-fetch');
reproEvents();
