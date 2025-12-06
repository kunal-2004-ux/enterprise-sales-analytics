const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Config
const INPUT_PATH = path.join(__dirname, '../../data/dataset.ndjson');
const OUTPUT_PATH = path.join(__dirname, '../../data/dataset_for_copy.csv');
const CHUNK_SIZE = 50000;

console.log(`Starting NDJSON -> CSV conversion for COPY ingest...`);
console.log(`Input: ${INPUT_PATH}`);
console.log(`Output: ${OUTPUT_PATH}`);

// Define CSV structure matching 001_create_sales.sql
const COLUMNS = [
    'transaction_id',
    'date',
    'customer_id',
    'customer_name',
    'phone',
    'gender',
    'age',
    'customer_region',
    'customer_type',
    'product_id',
    'product_name',
    'brand',
    'category',
    'tags', // Special handling for array
    'quantity',
    'price_per_unit',
    'discount_percentage',
    'total_amount',
    'final_amount',
    'payment_method',
    'order_status',
    'delivery_type',
    'store_id',
    'store_location',
    'salesperson_id',
    'salesperson_name'
];

/**
 * Escapes a string for CSV.
 * - Wraps in double quotes if it contains comma, newline, or double quote.
 * - Escapes double quotes with another double quote.
 */
function toCsvField(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Formats an array for Postgres text[] CSV import.
 * Postgres CSV format for arrays is: "{val1,val2}"
 * If values contain special characters they need double quotes and escaping inside the curly braces.
 * Standard implementation: quoted values separated by comma, wrapped in {}.
 */
function toPgArray(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '{}';

    const inner = arr.map(item => {
        // Escape backslashes and double-quotes
        let s = String(item).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `"${s}"`;
    }).join(',');

    // For CSV export, we then equate this whole string as one field.
    // BUT: standard CSV `copy` deals with `{...}` naturally. 
    // We just need to ensure the outer CSV writer treats it as a single field.
    return `{${inner}}`;
}

function processRow(line) {
    try {
        const data = JSON.parse(line);

        // Flatten logic
        const row = {
            transaction_id: data.transaction_id,
            date: data.date,
            customer_id: data.customer?.id,
            customer_name: data.customer?.name,
            phone: data.customer?.phone,
            gender: data.customer?.gender,
            age: data.customer?.age,
            customer_region: data.customer?.region,
            customer_type: data.customer?.type,
            product_id: data.product?.id,
            product_name: data.product?.name,
            brand: data.product?.brand,
            category: data.product?.category,
            tags: data.product?.tags, // Array
            quantity: data.quantity,
            price_per_unit: data.price_per_unit,
            discount_percentage: data.discount_percentage,
            total_amount: data.total_amount,
            final_amount: data.final_amount,
            payment_method: data.payment_method,
            order_status: data.order_status,
            delivery_type: data.delivery_type,
            store_id: data.store?.id,
            store_location: data.store?.location,
            salesperson_id: data.salesperson?.id,
            salesperson_name: data.salesperson?.name
        };

        return COLUMNS.map(col => {
            if (col === 'tags') {
                const pgArrayStr = toPgArray(row[col]);
                return toCsvField(pgArrayStr);
            }
            return toCsvField(row[col]);
        }).join(',');

    } catch (err) {
        // console.error('Skipping invalid JSON line', err);
        return null;
    }
}

// Create streams
const inputStream = fs.createReadStream(INPUT_PATH);
const outputStream = fs.createWriteStream(OUTPUT_PATH);
const rl = readline.createInterface({ input: inputStream, terminal: false });

// Write Header
outputStream.write(COLUMNS.join(',') + '\n');

let count = 0;

rl.on('line', (line) => {
    if (!line) return;
    const csvLine = processRow(line);
    if (csvLine) {
        outputStream.write(csvLine + '\n');
        count++;
        if (count % CHUNK_SIZE === 0) {
            console.log(`Processed ${count} records...`);
        }
    }
});

rl.on('close', () => {
    console.log(`Conversion complete. Total rows: ${count}`);
});
