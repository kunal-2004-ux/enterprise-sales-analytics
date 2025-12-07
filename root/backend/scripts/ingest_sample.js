const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');
const { mapCsvRow } = require('../src/mappers/mapCsvRow');

const SAMPLE_CSV = path.join(__dirname, '../../data/sample.csv');
const DDL_PATH = path.join(__dirname, '../db/migrations/001_create_sales.sql');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/postgres'
});

async function run() {
    try {
        console.log('Reading DDL...');
        const ddl = fs.readFileSync(DDL_PATH, 'utf8');

        console.log('Connecting to DB...');
        const client = await pool.connect();
        try {
            console.log('Applying Schema...');
            await client.query(ddl);
            console.log('Schema applied.');

            console.log('Reading CSV and Inserting Data...');
            const rows = [];

            await new Promise((resolve, reject) => {
                fs.createReadStream(SAMPLE_CSV)
                    .pipe(csv())
                    .on('data', (data) => rows.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });

            console.log(`Found ${rows.length} rows.`);

            for (const raw of rows) {
                const norm = mapCsvRow(raw);
                if (!norm) continue;

                // Build INSERT query
                const query = `
                    INSERT INTO sales (
                        transaction_id, date, customer_id, customer_name, phone, gender, age, 
                        customer_region, customer_type, product_id, product_name, brand, category, 
                        tags, quantity, price_per_unit, discount_percentage, total_amount, final_amount, 
                        payment_method, order_status, delivery_type, store_id, store_location, 
                        salesperson_id, salesperson_name
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
                    )
                `;

                const values = [
                    norm.transaction_id, norm.date, norm.customer.id, norm.customer.name, norm.customer.phone,
                    norm.customer.gender, norm.customer.age, norm.customer.region, norm.customer.type,
                    norm.product.id, norm.product.name, norm.product.brand, norm.product.category,
                    norm.product.tags, // pg node driver handles array automatically if passed as array
                    norm.quantity, norm.price_per_unit, norm.discount_percentage, norm.total_amount, norm.final_amount,
                    norm.payment_method, norm.order_status, norm.delivery_type, norm.store.id, norm.store.location,
                    norm.salesperson.id, norm.salesperson.name
                ];

                await client.query(query, values);
            }
            console.log('Data ingestion complete.');

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Ingestion failed:', err);
    } finally {
        await pool.end();
    }
}

run();
