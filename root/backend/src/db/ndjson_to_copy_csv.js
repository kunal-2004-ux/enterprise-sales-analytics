/**
 * db/ndjson_to_copy_csv.js
 *
 * Reads NDJSON data and outputs a CSV file optimized for Postgres COPY.
 * Usage: node db/ndjson_to_copy_csv.js <input-ndjson> <output-csv>
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const DEFAULT_INPUT = path.join(__dirname, '../../data/dataset.ndjson');
const DEFAULT_OUTPUT = path.join(__dirname, '../../data/dataset_for_copy.csv');

// Format array for Postgres: ['a', 'b'] -> "{a,b}"
// Escape double quotes inside elements with backslash or double quotes? 
// Postgres CSV format expects double quote escape as "". 
// Array literal format is different: {val1,val2}. Elements must be double quoted if they contain special chars.
function toPgArray(arr) {
    if (!arr || arr.length === 0) return '{}';
    // Clean and quote elements
    const items = arr.map(s => {
        // Escape backslashes and double quotes
        const escaped = String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `"${escaped}"`;
    });
    return `{${items.join(',')}}`;
}

// Convert value to CSV safe string
function toCsvVal(val) {
    if (val === null || val === undefined) return '';
    const s = String(val);
    // If contains quote, comma, or newline, wrap in quotes and escape internal quotes
    if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

// Map NDJSON object to array of columns in strict order
function mapToRowArray(data) {
    const cust = data.customer || {};
    const prod = data.product || {};
    const store = data.store || {};
    const sales = data.salesperson || {};

    return [
        data.transaction_id,
        data.date,
        cust.id,
        cust.name,
        cust.phone,
        cust.gender,
        cust.age,
        cust.region,
        cust.type,
        prod.id,
        prod.name,
        prod.brand,
        prod.category,
        toPgArray(prod.tags), // Handle array specifically
        data.quantity,
        data.price_per_unit,
        data.discount_percentage,
        data.total_amount,
        data.final_amount,
        data.payment_method,
        data.order_status,
        data.delivery_type,
        store.id,
        store.location,
        sales.id,
        sales.name
    ];
}

async function run(inputPath = DEFAULT_INPUT, outputPath = DEFAULT_OUTPUT) {
    console.log(`[ndjson_to_copy_csv] Starting conversion...`);
    console.log(`   Input: ${inputPath}`);
    console.log(`   Output: ${outputPath}`);

    if (!fs.existsSync(inputPath)) {
        console.error(`[ndjson_to_copy_csv] Error: Input file not found.`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(inputPath);
    const writeStream = fs.createWriteStream(outputPath);

    // Headers matching INSERT order in ingest_sample.js
    const headers = [
        'transaction_id', 'date', 'customer_id', 'customer_name', 'phone', 'gender', 'age',
        'customer_region', 'customer_type', 'product_id', 'product_name', 'brand', 'category',
        'tags', 'quantity', 'price_per_unit', 'discount_percentage', 'total_amount', 'final_amount',
        'payment_method', 'order_status', 'delivery_type', 'store_id', 'store_location',
        'salesperson_id', 'salesperson_name'
    ];

    // Write Header
    writeStream.write(headers.join(',') + '\n');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let count = 0;
    let lastLog = Date.now();

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const data = JSON.parse(line);
            const rowValues = mapToRowArray(data);

            // Join with commas, applying CSV escaping
            const csvLine = rowValues.map(v => {
                // If it's the tags column (index 13), it's already formatted as string "{...}"
                // But we still need to CSV-escape it if the string representation contains commas etc.
                // Actually toPgArray returns a string like "{a,b}". It might contain commas inside the {} but that's handled by Postgres array parser?
                // Wait, if I put "{a,b}" into a CSV column, does Postgres see it as one value?
                // Yes, as long as the CSV parser sees it as one field. 
                // So if it contains commas, I MUST quote the whole thing for CSV.
                // My toCsvVal handles quoting if comma is present.
                // However, toPgArray output might already be complex. 
                // Simple approach: Apply toCsvVal to EVERYTHING.
                return toCsvVal(v);
            }).join(',');

            writeStream.write(csvLine + '\n');
            count++;

            if (count % 50000 === 0) {
                const now = Date.now();
                const rate = 50000 / ((now - lastLog) / 1000);
                process.stdout.write(`\r[ndjson_to_copy_csv] Processed: ${count.toLocaleString()} rows (~${Math.round(rate)} r/s)`);
                lastLog = now;
            }
        } catch (err) {
            console.error(`Error parsing line: ${err.message}`);
        }
    }

    console.log(`\n[ndjson_to_copy_csv] Completed. Total rows: ${count.toLocaleString()}`);
}

// Allow standalone execution
if (require.main === module) {
    const args = process.argv.slice(2);
    run(args[0], args[1]).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { run };
