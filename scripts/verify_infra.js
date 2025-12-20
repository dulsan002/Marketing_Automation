const net = require('net');
const http = require('http');

const services = [
    { name: 'Postgres', port: 5432 },
    { name: 'Redis', port: 6379 },
    { name: 'Kafka', port: 9092 },
    { name: 'ClickHouse', port: 8123, type: 'http' },
    { name: 'Zookeeper', port: 2181 },
    { name: 'Kafka UI', port: 8080, type: 'http' }
];

const checkConnection = (name, port, type = 'tcp') => {
    return new Promise((resolve) => {
        if (type === 'http') {
            const req = http.get(`http://localhost:${port}/`, (res) => {
                // ClickHouse returns 200 OK text "Ok."
                // Kafka UI returns 200 or 302
                resolve({ name, status: 'UP', detail: `HTTP ${res.statusCode}` });
            });
            req.on('error', (err) => {
                resolve({ name, status: 'DOWN', detail: err.message });
            });
            req.end();
        } else {
            const socket = new net.Socket();
            socket.setTimeout(2000);
            socket.on('connect', () => {
                resolve({ name, status: 'UP', detail: 'Connected' });
                socket.destroy();
            });
            socket.on('timeout', () => {
                resolve({ name, status: 'DOWN', detail: 'Timeout' });
                socket.destroy();
            });
            socket.on('error', (err) => {
                resolve({ name, status: 'DOWN', detail: err.message });
                socket.destroy();
            });
            socket.connect(port, 'localhost');
        }
    });
};

const run = async () => {
    console.log('Verifying Infrastructure...');
    const results = await Promise.all(services.map(s => checkConnection(s.name, s.port, s.type)));

    console.table(results);

    const allUp = results.every(r => r.status === 'UP');
    if (allUp) {
        console.log('✅ All services are UP.');
        process.exit(0);
    } else {
        console.error('❌ Some services are DOWN.');
        process.exit(1);
    }
};

run();
