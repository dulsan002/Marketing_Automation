const { sequelize } = require('../backend/src/config/database');
const authService = require('../backend/src/modules/auth/auth.service');

// Manual JWT Decode to avoid dependency issues in verification script
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        // Fallback for simple node environment if atob/browser utils missing
        // Node has Buffer
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    }
}

async function verifyRegistration() {
    try {
        console.log('Syncing Database...');
        await sequelize.sync({ force: true });

        console.log('Registering Tenant "Acme Corp"...');
        const res = await authService.register('Acme Corp', 'admin@acme.com', 'password123');

        console.log('✅ Registration Successful');
        console.log('   Tenant:', res.user.tenantName, `(${res.user.tenantId})`);
        console.log('   User:', res.user.email, `(${res.user.role})`);

        // Verify Token Payload
        const decoded = parseJwt(res.accessToken);
        console.log('   Token Claims:', decoded);

        if (decoded.tenantId !== res.user.tenantId) throw new Error('Token missing tenantId');
        if (decoded.role !== 'ADMIN') throw new Error('Token missing role');

        console.log('✨ Registration Logic Verified');
        process.exit(0);

    } catch (e) {
        console.error('❌ Registration Verification Failed:', e);
        process.exit(1);
    }
}

verifyRegistration();
