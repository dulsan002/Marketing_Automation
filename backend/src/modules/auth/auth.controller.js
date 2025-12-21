const authService = require('./auth.service');

const register = async (req, res) => {
    try {
        const { tenantName, email, password } = req.body;
        if (!tenantName || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Tenant Name, Email and Password are required' });
        }
        const result = await authService.register(tenantName, email, password);
        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        if (error.message === 'User already exists' || error.message === 'Tenant name already taken') {
            return res.status(409).json({ status: 'error', message: error.message });
        }
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
    }
};

const login = async (req, res) => {
    try {
        const { tenantSlug, email, password } = req.body;
        if (!tenantSlug || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Tenant Slug, Email and Password are required' });
        }
        const result = await authService.login(tenantSlug, email, password);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        if (error.message === 'Invalid credentials' || error.message === 'Tenant is suspended' || error.message === 'User account is disabled') {
            return res.status(401).json({ status: 'error', message: error.message });
        }
        console.error('LOGIN ERROR:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error', error: error.message, stack: error.stack });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ status: 'error', message: 'Refresh Request Token is required' });
        }
        const result = await authService.refreshToken(refreshToken);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('not found')) {
            return res.status(403).json({ status: 'error', message: 'Invalid or expired refresh token' });
        }
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const me = async (req, res) => {
    res.status(200).json({ status: 'success', data: req.user });
};

module.exports = {
    register,
    login,
    refreshToken,
    me
};
