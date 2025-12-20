const { verifyAccessToken } = require('./auth.utils');

const authenticate = (req, res, next) => {
    // Bypass Removed: Strict Auth Enforced
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized - Missing Token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded; // Attach user payload to request (Legacy support)

        // Context for Tenant-Awareness (New Standard)
        req.context = {
            userId: decoded.sub || decoded.id,
            tenantId: decoded.tenantId,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized - Invalid or Expired Token' });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // 'admin' has access to everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user role is allowed
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient Permissions' });
        }

        next();
    };
};

module.exports = { authenticate, authorize };
