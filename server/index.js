const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConnection, sql, poolPromise } = require('./db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3001;

// CORS Configuration
const whitelist = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware
const authMiddleware = require('./middleware/authMiddleware');

// Routes - Public
app.use('/api', require('./routes/authRoutes')); // Login matches /api/login
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Routes - Protected
app.use('/api/users', authMiddleware, require('./routes/userRoutes'));
app.use('/api/roles', authMiddleware, require('./routes/roleRoutes'));
app.use('/api/empresas', authMiddleware, require('./routes/companyRoutes'));
app.use('/api/items', authMiddleware, require('./routes/itemRoutes'));
app.use('/api/tickets', authMiddleware, require('./routes/ticketRoutes'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboardRoutes'));
app.use('/api', authMiddleware, require('./routes/masterRoutes')); // Clients, Assets, etc.

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

const { startSyncService } = require('./services/sync-service');

app.listen(port, () => {
    console.log(`Server running on port ${port}`);

    // Start Background Sync Service
    try {
        // startSyncService(); // Disabled for debugging login 500
    } catch (err) {
        console.error('Failed to start sync service:', err);
    }
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});
