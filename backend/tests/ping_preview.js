const axios = require('axios');

async function checkPreview() {
    try {
        console.log('Pinging POST http://localhost:3001/api/segments/preview...');
        // We need auth? The route is protected.
        // But 404 comes before Auth usually? No, depends on middleware order.
        // If route doesn't exist, it falls through to 404 handler.
        // If route exists, it hits Auth middleware.
        // Let's try to hit it. If we get 401, the route EXISTS. If we get 404, it DOES NOT.

        await axios.post('http://localhost:3001/api/segments/preview', {});
    } catch (error) {
        if (error.response) {
            console.log(`Response Status: ${error.response.status}`);
            if (error.response.status === 404) {
                console.log('CONFIRMED: Endpoint not found (404). Server is likely stale.');
            } else if (error.response.status === 401) {
                console.log('Got 401. Route EXISTS! (Auth required). Server is up to date.');
            } else {
                console.log('Got other status:', error.response.status);
            }
        } else {
            console.log('Error:', error.message);
        }
    }
}

checkPreview();
