const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { mapCsvRow } = require('../src/mappers/mapCsvRow');

const INPUT_PATH = path.join(__dirname, '../../data/dataset.csv');
const OUTPUT_PATH = path.join(__dirname, '../../data/dataset.ndjson');

function isValid(row) {
    if (!row) return false;
    return (
        row.transaction_id &&
        row.date &&
        row.customer && row.customer.id && row.customer.name &&
        row.final_amount !== null && row.final_amount !== undefined
    );
}

function run() {
    console.log(`Starting CSV → NDJSON conversion`);
    console.log(`Input : ${INPUT_PATH}`);
    console.log(`Output: ${OUTPUT_PATH}`);

    // Ensure output directory exists
    const outDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const writeStream = fs.createWriteStream(OUTPUT_PATH, { flags: 'w' });

    let totalProcessed = 0;
    let skippedCount = 0;
    let paused = false;
    const LOG_INTERVAL = 50000;

    const readStream = fs.createReadStream(INPUT_PATH)
        .on('error', (err) => {
            console.error('Error opening input CSV:', err);
            process.exit(1);
        });

    const parser = csv();

    parser.on('data', (csvRow) => {
        // Pause parser if write returns false (backpressure)
        if (paused) return;

        try {
            const normalized = mapCsvRow(csvRow);
            totalProcessed++;

            if (isValid(normalized)) {
                const line = JSON.stringify(normalized) + '\n';
                const ok = writeStream.write(line);
                if (!ok) {
                    // Backpressure - pause the parser until drain
                    paused = true;
                    readStream.pause();
                }
            } else {
                skippedCount++;
            }

            if (totalProcessed % LOG_INTERVAL === 0) {
                console.log(`Processed ${totalProcessed} rows... (skipped ${skippedCount})`);
            }
        } catch (err) {
            skippedCount++;
            console.error('Error processing row at index', totalProcessed, err && err.message);
        }
    });

    // When write stream drains, resume parser & source
    writeStream.on('drain', () => {
        if (paused) {
            paused = false;
            readStream.resume();
        }
    });

    parser.on('end', () => {
        // end is emitted after all csv rows are parsed
        writeStream.end(() => {
            console.log('Conversion complete.');
            console.log(`Total Rows Processed: ${totalProcessed}`);
            console.log(`Skipped Rows: ${skippedCount}`);
            console.log(`Valid Rows Written: ${totalProcessed - skippedCount}`);
        });
    });

    parser.on('error', (err) => {
        console.error('CSV parser error:', err);
        process.exit(1);
    });

    // Pipe after wiring events
    readStream.pipe(parser);
}

run();
