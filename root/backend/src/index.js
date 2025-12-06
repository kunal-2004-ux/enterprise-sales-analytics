const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const salesRoutes = require('./routes/salesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach DB pool to request
app.use((req, res, next) => {
    req.pool = pool;
    next();
});

// Routes
app.use('/api', salesRoutes);

// Health Check
app.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok', db: true });
    } catch (error) {
        console.error('Database ping failed:', error.message);
        res.status(200).json({ status: 'ok', db: false, error: error.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'Something went wrong',
    });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app; // Export for testing
