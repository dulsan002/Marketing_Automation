const http = require('http');
const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');
const Contact = require('./src/modules/contacts/contact.model');
const Event = require('./src/modules/events/event.model');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'access_secret_123';
const tenantId = '8da838a0-e73f-4226-98da-c4c901e7041f';

async function verifyBan() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // 1. Setup: Get a random registration
        const reg = await Registration.findOne();
        if (!reg) { console.error('No regs found'); process.exit(1); }

        console.log(`Testing Ban on Reg ID: ${reg.id} (Current: ${reg.status})`);

        // 2. Perform API Call with Reason
        const token = jwt.sign({
            sub: 'test-user',
            email: 'test@test.com',
            role: 'admin',
            tenantId: tenantId
        }, JWT_SECRET, { expiresIn: '1h' });

        const reason = "Violation of Code of Conduct";
        const postData = JSON.stringify({ status: 'Banned', banReason: reason });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api/events/${reg.EventId}/registrations/${reg.id}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', async () => {
                console.log(`API Response: ${res.statusCode} ${data}`);

                // 3. Verify DB
                const updated = await Registration.findByPk(reg.id);
                console.log(`DB Status: ${updated.status}`);
                console.log(`DB BanReason: ${updated.banReason}`);

                if (updated.status === 'Banned' && updated.banReason === reason) {
                    console.log('✅ SUCCESS: User Banned with Reason.');
                } else {
                    console.error('❌ FAILURE: Status or Reason mismatch.');
                }
                process.exit(0);
            });
        });

        req.write(postData);
        req.end();

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verifyBan();
