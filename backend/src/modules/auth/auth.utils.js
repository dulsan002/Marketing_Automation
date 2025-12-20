const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_123';
const ACCESS_EXPIRES_IN = '24h'; // Dev friendly
const REFRESH_EXPIRES_IN = '7d'; // Long-lived

const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const generateAccessToken = (user) => {
    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
    };
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
};

const generateRefreshToken = (user) => {
    const payload = {
        sub: user.id,
        jti: uuidv4()
    };
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
