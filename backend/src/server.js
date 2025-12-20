require('dotenv').config();
const app = require('./app');
const { connectDB, sequelize } = require('./config/database');

// Avoid Port 3000 (Frontend uses it often)
const PORT = 3001; // Force 3001

const startServer = async () => {
    await connectDB();
    await sequelize.sync(); // Schema is stable, avoid alter collisions
    console.log('Database synced');

    // const { startConsumer } = require('./modules/analytics/ingestor/consumer');
    // const { startScheduler } = require('./modules/workflows/scheduler/scheduler.service');
    // const { startResumeConsumer } = require('./modules/workflows/scheduler/consumer');
    // const { startSegmentConsumer } = require('./modules/segments/engine/consumer');
    // const { initTriggerListener } = require('./modules/workflows/engine/trigger.listener');

    // Start Background Services
    if (process.env.NODE_ENV !== 'test') {
        // Disabled to fix DB Lock/Timeout issues during debugging
        // startConsumer();
        // startScheduler();
        // startResumeConsumer();
        // startSegmentConsumer();
        // initTriggerListener();
    }

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
