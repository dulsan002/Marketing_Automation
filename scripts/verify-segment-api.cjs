// Using native fetch
// Actually I'll use fetch if available or built-in, but node 18+ has fetch. 
// Or I can use the existing auth util to get a token and then make a request.

const { sequelize } = require('../backend/src/config/database');
const { generateAccessToken } = require('../backend/src/modules/auth/auth.utils');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const User = require('../backend/src/modules/auth/user.model');

async function testSegmentCreation() {
    try {
        console.log('🧪 Testing Segment Creation API...');

        // 1. Get Tenant and User
        const tenant = await Tenant.findOne({ where: { slug: 'nova' } });
        const user = await User.findOne({ where: { email: 'growth@nova.com' } });

        if (!tenant || !user) throw new Error('Tenant or User not found');

        // 2. Generate Token (Simulate Login)
        const token = generateAccessToken(user, tenant.id);
        console.log('🔑 Generated Test Token');

        // 3. Make API Call (using native fetch if available, or just mocking the logic? 
        // No, I want to hit the running server if possible. 
        // Assuming Node environment has fetch (Node 18+). If not, I'll rely on controller direct call?)
        // Let's rely on controller direct verification via code or assume fetch exists.

        // Alternative: Use existing axios from backend node_modules?

        const response = await fetch('http://localhost:3001/api/segments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'API Test Segment',
                description: 'Created via verification script',
                type: 'Static',
                ruleGroups: []
            })
        });

        if (!response.ok) {
            const err = await response.text();
            require('fs').writeFileSync('debug_api_error.log', err);
            throw new Error(`API Request Failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Segment Created Successfully!');
        console.log('📦 Response:', JSON.stringify(result.data, null, 2));

        if (result.data.name === 'API Test Segment' && result.data.TenantId === tenant.id) {
            console.log('🎉 Verification PASSED: Tenant ID matches.');
        } else {
            console.error('❌ Verification FAILED: mismatch.');
        }

    } catch (e) {
        console.error('❌ Test Failed:', e);
        process.exit(1);
    }
}

testSegmentCreation();
