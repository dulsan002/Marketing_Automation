const { authenticate, authorize } = require('../backend/src/modules/auth/auth.middleware');
const { generateAccessToken } = require('../backend/src/modules/auth/auth.utils');

// Mock Request/Response
const mockReq = (headers) => ({
    headers,
    user: null,
    context: null
});
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};
const mockNext = () => { };

async function verifyMiddleware() {
    try {
        console.log('Test: Middleware Context Injection');

        // 1. Create Token
        const user = {
            id: 'u-123',
            email: 'test@example.com',
            role: 'market-admin',
            tenantId: 't-999'
        };
        const token = generateAccessToken(user);

        // 2. Mock Request
        const req = mockReq({ authorization: `Bearer ${token}` });
        const res = mockRes();

        // 3. Execute Middleware
        authenticate(req, res, () => {
            console.log('✅ Middleware called next()');
        });

        // 4. Verify Context
        if (!req.context) throw new Error('req.context is missing');
        if (req.context.tenantId !== 't-999') throw new Error(`Wrong tenantId: ${req.context.tenantId}`);
        if (req.context.userId !== 'u-123') throw new Error(`Wrong userId: ${req.context.userId}`);

        console.log('   Context:', req.context);
        console.log('✨ Middleware Logic Verified');
        process.exit(0);

    } catch (e) {
        console.error('❌ Middleware Verification Failed:', e);
        process.exit(1);
    }
}

verifyMiddleware();
