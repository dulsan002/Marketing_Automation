const http = require('http');
const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');
const Contact = require('./src/modules/contacts/contact.model');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'access_secret_123';

async function reproJames() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // 1. Find James - use specific one from screenshot: James Miller
        const contact = await Contact.findOne({
            where: { firstName: 'James', lastName: 'Miller' }
        });

        if (!contact) {
            console.error('❌ James not found');
            process.exit(1);
        }

        const registration = await Registration.findOne({
            where: { ContactId: contact.id }
        });

        if (!registration) {
            console.error('❌ Registration not found');
            process.exit(1);
        }

        console.log(`Target Reg: ${registration.id}`);
        console.log(`Current Status: ${registration.status}`);

        const eventId = registration.EventId;
        const regId = registration.id;
        const tenantId = '8da838a0-e73f-4226-98da-c4c901e7041f';

        // 2. Prepare API Call
        const token = jwt.sign({
            sub: 'test-user',
            email: 'test@test.com',
            role: 'admin',
            tenantId: tenantId
        }, JWT_SECRET, { expiresIn: '1h' });

        const newStatus = 'Cancelled'; // Trying to set to Cancelled
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

        console.log(`Attempting PUT to ${options.path} with status '${newStatus}'...`);

        const req = http.request(options, (res) => {
            console.log(`HTTP STATUS: ${res.statusCode}`);
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', async () => {
                console.log('RESPONSE:', data);

                // 3. Verify DB
                const updated = await Registration.findByPk(regId);
                console.log(`DB Status AFTER API: '${updated.status}'`);

                if (updated.status === newStatus) {
                    console.log('✅ SUCCESS: Status updated.');
                } else {
                    console.log('❌ FAIL: Status did NOT update.');
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

reproJames();
