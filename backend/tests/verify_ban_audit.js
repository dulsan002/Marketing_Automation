const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');
const BanLog = require('./src/modules/events/ban-log.model');
const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = 'access_secret_123';
const tenantId = '8da838a0-e73f-4226-98da-c4c901e7041f';

async function verifyBanAudit() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // 1. Find a target registration
        const reg = await Registration.findOne({ where: { status: 'Registered' } });
        if (!reg) {
            console.log('No Registered user found. Resetting one...');
            const anyReg = await Registration.findOne();
            await anyReg.update({ status: 'Registered' });
            // re-fetch
        }

        const target = await Registration.findOne({ where: { status: 'Registered' } });
        console.log(`Target Reg ID: ${target.id}`);

        // 2. Perform Ban via API (simulate Frontend Call)
        const token = jwt.sign({ sub: 'test-admin', email: 'admin@test.com', role: 'admin', tenantId }, JWT_SECRET);

        const payload = JSON.stringify({
            status: 'Banned',
            banReason: 'Security Violation',
            adminName: 'Super Admin',
            adminEmail: 'super@admin.com'
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api/events/${target.EventId}/registrations/${target.id}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', async () => {
                console.log(`API Response: ${res.statusCode}`);

                // 3. Verify BanLog
                const log = await BanLog.findOne({
                    where: { RegistrationId: target.id },
                    order: [['createdAt', 'DESC']]
                });

                if (!log) {
                    console.error('❌ FAILURE: No BanLog found.');
                    process.exit(1);
                }

                console.log('Found Log:', JSON.stringify(log.toJSON(), null, 2));

                if (log.bannedByName === 'Super Admin' && log.bannedByEmail === 'super@admin.com' && log.reason === 'Security Violation') {
                    console.log('✅ SUCCESS: Ban Log audit trail verified.');
                    process.exit(0);
                } else {
                    console.error('❌ FAILURE: Audit details mismatch.');
                    process.exit(1);
                }
            });
        });

        req.write(payload);
        req.end();

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verifyBanAudit();
