/**
 * scripts/csvToNdjson.js
 *
 * Streams a large CSV file, normalizes it using mapCsvRow, and outputs NDJSON.
 * Usage: node scripts/csvToNdjson.js <input-csv> <output-ndjson>
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Transform } = require('stream');
const { mapCsvRow } = require('../src/mappers/mapCsvRow');

// Default paths if not provided
const DEFAULT_INPUT = path.join(__dirname, '../../data/dataset.csv');
const DEFAULT_OUTPUT = path.join(__dirname, '../../data/dataset.ndjson');

async function run(inputPath = DEFAULT_INPUT, outputPath = DEFAULT_OUTPUT) {
    console.log(`[csvToNdjson] Starting conversion...`);
    console.log(`   Input: ${inputPath}`);
    console.log(`   Output: ${outputPath}`);

    if (!fs.existsSync(inputPath)) {
        console.error(`[csvToNdjson] Error: Input file not found at ${inputPath}`);
        process.exit(1);
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let lastLog = Date.now();

    // Transform stream to map and validate
    const transformRow = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
            processedCount++;

            try {
                // Normalize using existing mapper
                const mapped = mapCsvRow(chunk);

                // Validation: Ensure transaction_id exists
                if (!mapped || !mapped.transaction_id) {
                    errorCount++;
                    // Skip invalid rows (silently or log verbose if needed)
                    return callback();
                }

                successCount++;

                // Convert to NDJSON string + newline
                const ndjsonLine = JSON.stringify(mapped) + '\n';
                this.push(ndjsonLine);
            } catch (err) {
                errorCount++;
                console.error(`[csvToNdjson] Row error: ${err.message}`);
            }

            // Progress logging
            if (processedCount % 50000 === 0) {
                const now = Date.now();
                const rate = 50000 / ((now - lastLog) / 1000);
                console.log(`[csvToNdjson] Processed: ${processedCount.toLocaleString()} | Valid: ${successCount.toLocaleString()} | Errors: ${errorCount.toLocaleString()} | Rate: ~${Math.round(rate)} rows/s`);
                lastLog = now;
            }

            callback();
        }
    });

    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(inputPath);
        const writeStream = fs.createWriteStream(outputPath);

        readStream
            .pipe(csv())
            .pipe(transformRow)
            .pipe(writeStream)
            .on('finish', () => {
                console.log(`[csvToNdjson] Completed.`);
                console.log(`   Total Processed: ${processedCount.toLocaleString()}`);
                console.log(`   Successfully Written: ${successCount.toLocaleString()}`);
                console.log(`   Skipped/Errors: ${errorCount.toLocaleString()}`);
                resolve();
            })
            .on('error', (err) => {
                console.error('[csvToNdjson] Pipeline failed:', err);
                reject(err);
            });

        writeStream.on('error', (err) => {
            console.error('[csvToNdjson] Write failed:', err);
            reject(err);
        });
    });
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
