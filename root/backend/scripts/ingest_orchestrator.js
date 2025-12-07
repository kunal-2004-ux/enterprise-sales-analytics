/**
 * scripts/ingest_orchestrator.js
 *
 * Orchestrates the full ingestion pipeline:
 * 1. Convert CSV -> NDJSON (Normalization & Validation)
 * 2. Convert NDJSON -> COPY-ready CSV (Flattening & Formatting)
 * 3. Print the final Postgres COPY command.
 *
 * Usage: node scripts/ingest_orchestrator.js
 */

const fs = require('fs');
const path = require('path');

// Import worker modules
const csvToNdjson = require('./csvToNdjson');
const ndjsonToCopy = require('../db/ndjson_to_copy_csv');

// Paths
const DATA_DIR = path.join(__dirname, '../../data');
const INPUT_CSV = path.join(DATA_DIR, 'dataset.csv');
const NDJSON_FILE = path.join(DATA_DIR, 'dataset.ndjson');
const COPY_CSV_FILE = path.join(DATA_DIR, 'dataset_for_copy.csv');

async function main() {
    console.log('==================================================');
    console.log('   POSTGRES INGESTION PIPELINE ORCHESTRATOR');
    console.log('==================================================');

    // 1. Check Input
    if (!fs.existsSync(INPUT_CSV)) {
        console.error(`\n[!] CRITICAL: Input file missing at: ${INPUT_CSV}`);
        console.error('    Please place your full dataset.csv there before running.');
        process.exit(1);
    }
    console.log(`\n[1/3] Input Check Passed: ${INPUT_CSV}`);

    // 2. CSV -> NDJSON
    console.log('\n[2/3] Running CSV -> NDJSON Conversion...');
    try {
        await csvToNdjson.run(INPUT_CSV, NDJSON_FILE);
    } catch (err) {
        console.error('[!] CSV Conversion Failed:', err);
        process.exit(1);
    }

    // 3. NDJSON -> COPY CSV
    console.log('\n[3/3] Running NDJSON -> COPY CSV Conversion...');
    try {
        await ndjsonToCopy.run(NDJSON_FILE, COPY_CSV_FILE);
    } catch (err) {
        console.error('[!] COPY CSV preparation Failed:', err);
        process.exit(1);
    }

    // 4. Instructions
    console.log('\n==================================================');
    console.log('   PIPELINE COMPLETE - READY FOR IMPORT');
    console.log('==================================================');
    console.log(`\nFile ready for import: ${COPY_CSV_FILE}`);
    console.log('\nTo import this data into your local Postgres database, open psql and run:');

    // Exact columns matching ndjson_to_copy_csv.js order
    const columns = [
        'transaction_id', 'date', 'customer_id', 'customer_name', 'phone', 'gender', 'age',
        'customer_region', 'customer_type', 'product_id', 'product_name', 'brand', 'category',
        'tags', 'quantity', 'price_per_unit', 'discount_percentage', 'total_amount', 'final_amount',
        'payment_method', 'order_status', 'delivery_type', 'store_id', 'store_location',
        'salesperson_id', 'salesperson_name'
    ];

    const copyCmd = `\\copy sales(${columns.join(', ')}) FROM '${COPY_CSV_FILE.replace(/\\/g, '/')}' WITH (FORMAT csv, HEADER true, NULL '');`;

    console.log('\n' + copyCmd);
    console.log('\nAfter import, remember to create indexes using:');
    console.log('   \\i db/migrations/002_create_indexes.sql');
    console.log('\nRecommended Postgres Settings for Bulk Load (optional):');
    console.log('   SET maintenance_work_mem = \'1GB\';');
    console.log('   SET max_wal_size = \'4GB\';');
    console.log('\n==================================================');
}

main().catch(err => {
    console.error('Orchestrator failed:', err);
    process.exit(1);
});
