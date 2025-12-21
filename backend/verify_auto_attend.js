const http = require('http');
const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');
const Event = require('./src/modules/events/event.model');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'access_secret_123';
const tenantId = '8da838a0-e73f-4226-98da-c4c901e7041f';

async function verifyAutoAttend() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // 1. Create a Test Event
        const event = await Event.create({
            name: 'Auto Attend Test Event',
            type: 'Webinar',
            status: 'Published',
            startDate: new Date(),
            TenantId: tenantId
        });
        console.log(`Created Event: ${event.id}`);

        // 2. Register 2 Users
        const reg1 = await Registration.create({
            EventId: event.id,
            status: 'Registered',
            firstName: 'User1',
            email: 'user1@test.com'
        });
        const reg2 = await Registration.create({
            EventId: event.id,
            status: 'Pending',
            firstName: 'User2',
            email: 'user2@test.com'
        });
        const reg3 = await Registration.create({
            EventId: event.id,
            status: 'Cancelled',
            firstName: 'User3',
            email: 'user3@test.com'
        });

        console.log(`Registrations created: Reg(${reg1.status}), Pend(${reg2.status}), Canc(${reg3.status})`);

        // 3. Update Event to Completed via API
        const token = jwt.sign({
            sub: 'test-user',
            email: 'test@test.com',
            role: 'admin',
            tenantId: tenantId
        }, JWT_SECRET, { expiresIn: '1h' });

        const postData = JSON.stringify({ status: 'Completed' }); // Frontend maps 'finished' -> 'Completed'
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api/events/${event.id}`,
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
                console.log(`Event Update API: ${res.statusCode}`);

                // 4. Verify Registrations
                const r1 = await Registration.findByPk(reg1.id);
                const r2 = await Registration.findByPk(reg2.id);
                const r3 = await Registration.findByPk(reg3.id);

                console.log(`Reg1 (Registered) -> ${r1.status}`);
                console.log(`Reg2 (Pending)    -> ${r2.status}`);
                console.log(`Reg3 (Cancelled)  -> ${r3.status}`);

                if (r1.status === 'Attended' && r2.status === 'Attended' && r3.status === 'Cancelled') {
                    console.log('✅ SUCCESS: Auto-attend worked correctly.');
                } else {
                    console.error('❌ FAILURE: Statuses incorrect.');
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

verifyAutoAttend();
