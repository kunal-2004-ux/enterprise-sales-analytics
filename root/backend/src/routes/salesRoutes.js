// backend/src/routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const { querySales } = require('../services/pgFilterService');
const { parseAndValidateQuery } = require('../utils/validate');

// GET /api/sales
router.get('/sales', async (req, res, next) => {
    try {
        const params = parseAndValidateQuery(req.query);
        const result = await querySales(req.pool, params);

        // Format dates in cursor if necessary?
        // Client usually handles Date obj from JSON as ISO string, which matches our cursor expectations

        res.json(result);
    } catch (err) {
        if (err.status) {
            res.status(err.status).json({ error: err.message });
        } else {
            next(err);
        }
    }
});

// GET /api/filters
router.get('/filters', async (req, res, next) => {
    try {
        const pool = req.pool;

        // Run distinct queries in parallel for performance
        const queries = {
            region: "SELECT DISTINCT customer_region FROM sales WHERE customer_region IS NOT NULL ORDER BY customer_region LIMIT 100",
            gender: "SELECT DISTINCT gender FROM sales WHERE gender IS NOT NULL ORDER BY gender LIMIT 100",
            category: "SELECT DISTINCT category FROM sales WHERE category IS NOT NULL ORDER BY category LIMIT 100",
            payment: "SELECT DISTINCT payment_method FROM sales WHERE payment_method IS NOT NULL ORDER BY payment_method LIMIT 100",
            tags: "SELECT DISTINCT tag FROM (SELECT unnest(tags) as tag FROM sales) t WHERE tag IS NOT NULL ORDER BY tag LIMIT 100"
        };

        const promises = Object.entries(queries).map(async ([key, sql]) => {
            const result = await pool.query(sql);
            // Map rows to single values
            const colName = result.fields[0].name; // dynamic
            return { [key]: result.rows.map(r => r[colName]) };
        });

        const results = await Promise.all(promises);

        // Merge results: [{region:[]}, {gender:[]}] -> {region:[], gender:[]}
        const response = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});

        res.json(response);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
