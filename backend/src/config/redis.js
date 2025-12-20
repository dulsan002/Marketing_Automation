const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err.message));
redisClient.on('connect', () => console.log('✅ Redis Client Connected'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Redis Connection Failed:', error.message);
        // Do not throw in dev/test without docker
    }
};

module.exports = { redisClient, connectRedis };
