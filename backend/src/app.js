const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB, sequelize } = require('./config/database');
const authRoutes = require('./modules/auth/auth.routes');
const User = require('./modules/auth/user.model');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database Connection
// moved to server.js

// Routes
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/base', require('./modules/base.routes')); // Legacy/Base
app.use('/api', require('./modules/base.routes')); // Keeping both for safety if base.routes defines /tenants
app.use('/api/campaigns', require('./modules/campaigns/campaign.routes'));
app.use('/api/segments', require('./modules/segments/segment.routes'));
app.use('/api/workflows', require('./modules/workflows/workflow.routes'));
app.use('/api/events', require('./modules/events/event.routes'));
app.use('/api/contacts', require('./modules/contacts/contact.routes'));
app.use('/api/abm/accounts', require('./modules/abm/account.routes'));
app.use('/api/analytics', require('./modules/analytics/analytics.routes'));

// Seeder Route
const { seedBaseData } = require('./common/seeder');
app.post('/api/seed/base', seedBaseData);

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 Handler - Invalid Routes
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
    // Log the error stack for debugging
    if (process.env.NODE_ENV !== 'test') {
        console.error(err.stack);
    }

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});



module.exports = app;
