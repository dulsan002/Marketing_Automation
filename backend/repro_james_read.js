const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'access_secret_123';
const tenantId = '8da838a0-e73f-4226-98da-c4c901e7041f';

function readJames() {
    const token = jwt.sign({
        sub: 'test-user',
        email: 'test@test.com',
        role: 'admin',
        tenantId: tenantId
    }, JWT_SECRET, { expiresIn: '1h' });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/events/registrations',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                const james = json.data.find(r => r.Contact.firstName === 'James' && r.Contact.lastName === 'Miller');
                if (james) {
                    console.log(`API READ STATUS for James: '${james.status}'`);
                } else {
                    console.log('James not found in API response');
                }
            } catch (e) {
                console.error(e);
            }
        });
    });

    req.end();
}

readJames();
