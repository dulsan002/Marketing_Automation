const fetch = globalThis.fetch;

async function checkPort(port) {
    try {
        console.log(`Checking Port ${port}...`);
        const res = await fetch(`http://localhost:${port}/api/health`);
        if (res.ok) {
            console.log(`FOUND BACKEND AT PORT ${port}`);
            process.exit(0);
        } else {
            console.log(`Port ${port} answered but not ok: ${res.status}`);
        }
    } catch (e) {
        console.log(`Port ${port} failed: ${e.code || e.message}`);
    }
}

async function run() {
    await checkPort(3000);
    await checkPort(3001);
    await checkPort(3002);
    await checkPort(8080);
    console.log('No backend found.');
}
run();
