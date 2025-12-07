const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Pool } = require('pg');

// Configuration
const BATCH_SIZE = 1000; // Rows per insert
const INPUT_FILE = path.join(__dirname, '../../data/dataset.csv'); // Adjust path as needed

if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is required.");
    console.error("Usage: $env:DATABASE_URL='...'; node cloud_ingest_full.js");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon
});

// Helper to clean tags
function parseTags(raw) {
    if (!raw) return '{}';
    // Remove brackets, quotes, and whitespace to extract values
    // Example: "['a', 'b']" -> "a,b" -> "{a,b}"
    // Example: "5" -> "5" -> "{5}"
    let clean = raw.replace(/[\[\]'"]/g, '').trim();
    if (clean.length === 0) return '{}';
    return `{${clean}}`;
}

async function run() {
    console.log(`[*] Starting ingestion from ${INPUT_FILE}`);
    console.log(`[*] Batch Size: ${BATCH_SIZE}`);

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Error: File not found: ${INPUT_FILE}`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let header = null;
    let batch = [];
    let totalInserted = 0;
    let startTime = Date.now();

    for await (const line of rl) {
        if (!header) {
            header = line.split(',');
            continue;
        }

        const cols = line.split(',');

        // Correct Mapping based on Schema and CSV headers
        const row = {
            transaction_id: cols[0],
            date: cols[1],
            customer_id: cols[2],
            customer_name: cols[3],
            customer_region: cols[4],
            age: parseInt(cols[5]) || 0,
            gender: cols[6],
            product_id: cols[7],
            category: cols[8],
            quantity: parseInt(cols[9]) || 0,
            price_per_unit: parseFloat(cols[10]) || 0.0,
            final_amount: parseFloat(cols[11]) || 0.0,
            payment_method: cols[12],
            salesperson_id: cols[13],
            discount_percentage: parseFloat(cols[14]) || 0.0,
            tags: parseTags(cols[15]) // Use helper
        };

        batch.push(row);

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            totalInserted += batch.length;
            process.stdout.write(`\r[+] Inserted: ${totalInserted.toLocaleString()} rows...`);
            batch = [];
        }
    }

    // Insert remaining
    if (batch.length > 0) {
        await insertBatch(batch);
        totalInserted += batch.length;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\n[SUCCESS] Ingestion Complete!`);
    console.log(`Total Rows: ${totalInserted.toLocaleString()}`);
    console.log(`Time Taken: ${duration}s`);
    pool.end();
}

async function insertBatch(rows) {
    if (rows.length === 0) return;

    const keys = [
        'transaction_id', 'date', 'customer_id', 'customer_name', 'customer_region',
        'age', 'gender', 'product_id', 'category', 'quantity',
        'price_per_unit', 'final_amount', 'payment_method', 'salesperson_id',
        'discount_percentage', 'tags'
    ];

    const values = [];
    const placeHolders = [];

    rows.forEach((row, rowIndex) => {
        const rowPlaceholders = [];
        keys.forEach((key, colIndex) => {
            const globalIndex = (rowIndex * keys.length) + colIndex + 1;
            rowPlaceholders.push(`$${globalIndex}`);
            values.push(row[key]);
        });
        placeHolders.push(`(${rowPlaceholders.join(',')})`);
    });

    const query = `
        INSERT INTO sales (${keys.join(',')}) 
        VALUES ${placeHolders.join(',')}
    `;

    try {
        await pool.query(query, values);
    } catch (err) {
        console.error('\n[!] Batch Insert Failed:', err.message);
        process.exit(1);
    }
}

run().catch(e => console.error(e));
