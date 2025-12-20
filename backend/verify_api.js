const BASE_URL = 'http://localhost:3000/api';

async function verify() {
    try {
        // 1. Register/Login
        console.log('Registering...');
        const email = `verifier_${Date.now()}@test.com`;

        const resReg = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'Password123!' })
        });
        const dataReg = await resReg.json();

        if (!resReg.ok) throw new Error(JSON.stringify(dataReg));
        const token = dataReg.data.accessToken;
        console.log('Token acquired.');

        // 2. Create Verification Tenant
        console.log('Creating Verification Tenant...');
        const resTenant = await fetch(`${BASE_URL}/tenants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'Verif Corp' })
        });
        const dataTenant = await resTenant.json();
        const tenantId = dataTenant.data.id;
        console.log('Tenant Created:', tenantId);

        // 3. Create Account
        console.log('Creating Account...');
        const resAcc = await fetch(`${BASE_URL}/abm/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'API Check Inc',
                domain: 'apicheck.com',
                tenantId
            })
        });
        const dataAcc = await resAcc.json();
        const accId = dataAcc.data.id;

        // 4. Fetch Accounts
        console.log('Fetching Accounts...');
        const resList = await fetch(`${BASE_URL}/abm/accounts?tenantId=${tenantId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataList = await resList.json();

        const accounts = dataList.data;
        console.log('Accounts Count:', accounts.length);
        if (accounts.length > 0) {
            const a = accounts[0];
            console.log('Account[0] Keys:', Object.keys(a));
            console.log('Account[0] Intent Score:', a.intentScore);
            console.log('Account[0] Intent Signals:', a.intentSignals);
        }

        // 5. Fetch Intent
        console.log('Fetching Intent...');
        const resIntent = await fetch(`${BASE_URL}/abm/intent?tenantId=${tenantId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataIntent = await resIntent.json();
        console.log('Intent Data Type:', typeof dataIntent.data);
        if (Array.isArray(dataIntent.data)) {
            console.log('Intent Items:', dataIntent.data.length);
            if (dataIntent.data.length > 0) {
                console.log('Intent Item[0]:', dataIntent.data[0]);
            }
        }

        console.log('Verification Complete.');
    } catch (e) {
        console.error('Verification Failed:', e);
    }
}

verify();
