const https = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';
const TENANT_ID = 't-dev-01';

async function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}tenantId=${TENANT_ID}`;
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
                } else {
                    reject({ status: res.statusCode, body: data, url: url });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function checkHealth() {
    console.log('--- Checking Health ---');
    try {
        const res = await request('GET', '/health');
        console.log('✅ Health Check Passed:', res);
        return true;
    } catch (e) {
        console.error('❌ Health Check Failed:', e);
        return false;
    }
}

async function verifyCampaigns() {
    console.log('\n--- Verifying Campaigns ---');
    const created = await request('POST', '/campaigns', {
        name: 'Integration Test Campaign',
        type: 'Email',
        status: 'DRAFT',
        description: 'Verify Script',
        content: { subject: 'Hi' }
    });
    console.log('✅ Created:', created.data.id);
    const id = created.data.id;

    await request('PATCH', `/campaigns/${id}`, { name: 'Updated' });
    console.log('✅ Updated');

    await request('POST', `/campaigns/${id}/archive`, {});
    console.log('✅ Archived');
}

async function verifySegments() {
    console.log('\n--- Verifying Segments ---');
    const created = await request('POST', '/segments', {
        name: 'Integration Test Segment',
        type: 'Dynamic',
        ruleGroups: [{ condition: 'AND', rules: [{ field: 'email', operator: 'contains', value: '@test' }] }]
    });
    console.log('✅ Created:', created.data.id);
    const id = created.data.id;

    const fetched = await request('GET', `/segments/${id}`);
    if (fetched.data.name !== 'Integration Test Segment') throw new Error('Name mismatch');
    console.log('✅ Fetched');

    await request('DELETE', `/segments/${id}`);
    console.log('✅ Deleted');
}

async function verifyWorkflows() {
    console.log('\n--- Verifying Workflows ---');
    const created = await request('POST', '/workflows', {
        name: 'Integration Test Workflow',
        status: 'draft',
        nodes: [],
        edges: [],
        trigger: { type: 'manual' }
    });
    console.log('✅ Created:', created.data.id);
    const id = created.data.id;

    await request('PATCH', `/workflows/${id}`, { name: 'Updated Workflow Name' });
    console.log('✅ Updated');

    await request('DELETE', `/workflows/${id}`);
    console.log('✅ Deleted');
}

async function run() {
    const health = await checkHealth();
    if (!health) {
        fs.writeFileSync('infra/verification_result.txt', 'FAILED: Backend Unhealthy or Not Reachable');
        process.exit(1);
    }

    try {
        await verifyCampaigns();
        await verifySegments();
        await verifyWorkflows();
        console.log('\n✨ Verification Complete.');
        fs.writeFileSync('infra/verification_result.txt', 'SUCCESS');
    } catch (e) {
        console.error('❌ Verification Failed:', e);
        fs.writeFileSync('infra/verification_result.txt', 'FAILED: ' + JSON.stringify(e));
        process.exit(1);
    }
}

run();
