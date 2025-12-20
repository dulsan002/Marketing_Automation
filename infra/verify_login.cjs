const { sequelize } = require('../backend/src/config/database');
const authService = require('../backend/src/modules/auth/auth.service');

// Manual JWT Decode helper
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    }
}

async function verifyLogin() {
    try {
        console.log('Syncing Database...');
        await sequelize.sync({ force: true });

        console.log('Registering Tenant "Acme Corp"...');
        await authService.register('Acme Corp', 'admin@acme.com', 'password123');

        // Test 1: Valid Login
        console.log('Test 1: Valid Login (acme-corp)...');
        const loginRes = await authService.login('acme-corp', 'admin@acme.com', 'password123');
        console.log('✅ Valid Login Successful');

        const decoded = parseJwt(loginRes.accessToken);
        if (decoded.tenantId !== loginRes.user.tenantId) throw new Error('Token missing tenantId');
        if (decoded.email !== 'admin@acme.com') throw new Error('Token missing email');

        // Test 2: Invalid Tenant Slug
        console.log('Test 2: Invalid Tenant Slug (bad-slug)...');
        try {
            await authService.login('bad-slug', 'admin@acme.com', 'password123');
            throw new Error('❌ Failed: Should have rejected invalid tenant');
        } catch (e) {
            if (e.message === 'Invalid credentials' || e.message === 'Tenant not found' || e.message === 'Invalid Tenant') {
                console.log('✅ Rejected Invalid Tenant (Caught expected error:', e.message, ')');
            } else {
                console.error('❌ Failed: Unexpected error for invalid tenant:', e.message);
                process.exit(1);
            }
        }

        // Test 3: Invalid Password
        console.log('Test 3: Invalid Password...');
        try {
            await authService.login('acme-corp', 'admin@acme.com', 'wrongpass');
            throw new Error('❌ Failed: Should have rejected invalid password');
        } catch (e) {
            if (e.message === 'Invalid credentials') {
                console.log('✅ Rejected Invalid Password');
            } else {
                console.error('❌ Failed: Unexpected error for invalid password:', e.message);
                process.exit(1);
            }
        }

        console.log('✨ Login Logic Verified');
        process.exit(0);

    } catch (e) {
        console.error('❌ Login Verification Failed:', e);
        process.exit(1);
    }
}

verifyLogin();
