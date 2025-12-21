const http = require('http');
const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'access_secret_123';
const tenantId = '8da838a0-e73f-4226-98da-c4c901e7041f';

function updateStatus(eventId, regId, newStatus) {
    return new Promise((resolve, reject) => {
        const token = jwt.sign({
            sub: 'test-user',
            email: 'test@test.com',
            role: 'admin',
            tenantId: tenantId
        }, JWT_SECRET, { expiresIn: '1h' });

        const postData = JSON.stringify({ status: newStatus });
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api/events/${eventId}/registrations/${regId}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) resolve(data);
                else reject(`HTTP ${res.statusCode}: ${data}`);
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function bulkVerify() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Get 3 random registrations that are NOT James Miller
        const allRegs = await Registration.findAll();
        // Simple random pick
        const sample = allRegs.slice(0, 3);

        console.log(`Testing ${sample.length} random registrations...`);
        console.log('------------------------------------------------');

        const testStatuses = ['Pending', 'Cancelled', 'Registered'];

        for (let i = 0; i < sample.length; i++) {
            const reg = sample[i];
            const targetStatus = testStatuses[i % testStatuses.length];

            console.log(`[Reg ${reg.id}] Current: '${reg.status}' -> Target: '${targetStatus}'`);

            try {
                // 1. Update via API
                await updateStatus(reg.EventId, reg.id, targetStatus);
                console.log(`   API Call: Success`);

                // 2. Verify via DB
                const updated = await Registration.findByPk(reg.id);
                if (updated.status === targetStatus) {
                    console.log(`   DB Verify: ✅ MATCH ('${updated.status}')`);
                } else {
                    console.error(`   DB Verify: ❌ MISMATCH (Approx '${updated.status}' vs '${targetStatus}')`);
                }

            } catch (err) {
                console.error(`   API Call Failed:`, err);
            }
            console.log('------------------------------------------------');
        }

    } catch (e) {
        console.error(e);
    }
}

bulkVerify();
