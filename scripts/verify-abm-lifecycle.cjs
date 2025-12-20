const API_URL = 'http://localhost:3001/api';
let authToken;
let tenantSlug;

async function setupAuth() {
    const timestamp = Date.now();
    const testEmail = `admin-${timestamp}@test.com`;
    const testPassword = 'password123';
    const testTenant = `Tenant ${timestamp}`;

    console.log('\n0. Setting up Auth (Registering Tenant)...');
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantName: testTenant,
                email: testEmail,
                password: testPassword
            })
        });

        const body = await res.json();
        if (!res.ok) throw new Error(body.message || res.statusText);

        // Structure check
        if (body.data && body.data.accessToken) {
            authToken = body.data.accessToken;
            // Check where tenantSlug is. 
            // Based on service: data.user.tenantSlug
            if (body.data.user && body.data.user.tenantSlug) {
                tenantSlug = body.data.user.tenantSlug;
            } else {
                console.warn('Tenant slug not found in expected user object');
                // Try login to recover
                throw new Error('Tenant slug missing in register response');
            }
            console.log('✓ Registration successful, token received');
        } else {
            throw new Error('Token missing in registration response');
        }

    } catch (error) {
        console.error('Auth setup failed', error.message);
        process.exit(1);
    }
}

async function runTest() {
    await setupAuth();

    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
    let accountId;
    let memberId;

    console.log('\n1. Creating Test Account...');
    try {
        const res = await fetch(`${API_URL}/abm/accounts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Test ABM Account ' + Date.now(),
                domain: 'testabm.com',
                industry: 'Tech',
                tier: 'Tier 1'
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || res.statusText);
        accountId = data.data.id;
        console.log('✓ Account created:', accountId);
    } catch (e) {
        console.error('Failed to create account', e.message);
    }

    console.log('\n2. Creating Test Contact...');
    try {
        const email = `test.contact.${Date.now()}@testabm.com`;
        const contactRes = await fetch(`${API_URL}/contacts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'User',
                email: email,
                title: 'Manager'
            })
        });
        const contactData = await contactRes.json();

        if (contactRes.ok) {
            console.log('✓ Contact created:', contactData.data.id);
        } else {
            console.warn('Contact creation warning:', contactData.message);
        }

        console.log('\n3. Adding Member to Committee...');
        const memberRes = await fetch(`${API_URL}/abm/accounts/${accountId}/members`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                email: email,
                role: 'Decision Maker'
            })
        });
        const memberData = await memberRes.json();
        if (!memberRes.ok) throw new Error(memberData.message);

        memberId = memberData.data.id;
        console.log('✓ Member added to committee');

    } catch (e) {
        console.error('Failed in contact/member operations', e.message);
    }

    if (memberId) {
        console.log('\n4. Verifying Member in Committee List...');
        try {
            const res = await fetch(`${API_URL}/abm/accounts/${accountId}`, { headers });
            const data = await res.json();
            const members = data.data.buyingCommittee || data.data.Contacts || [];
            const found = members.find(m => m.id === memberId);
            if (found) console.log('✓ Member found in account');
            else console.error('✗ Member NOT found in account');
        } catch (e) {
            console.error('Failed to fetch account', e.message);
        }

        console.log('\n5. Deleting Member...');
        try {
            const res = await fetch(`${API_URL}/abm/accounts/${accountId}/members/${memberId}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                console.log('✓ Delete request successful');
            } else {
                const d = await res.json();
                throw new Error(d.message);
            }
        } catch (e) {
            console.error('Failed to delete member', e.message);
        }

        console.log('\n6. Verifying Member Deletion...');
        try {
            const res = await fetch(`${API_URL}/abm/accounts/${accountId}`, { headers });
            const data = await res.json();
            const members = data.data.buyingCommittee || data.data.Contacts || [];
            const found = members.find(m => m.id === memberId);
            if (!found) console.log('✓ Member successfully removed from account');
            else console.error('✗ Member STILL in account');
        } catch (e) {
            console.error('Failed to fetch account', e.message);
        }
    }
}

runTest();
