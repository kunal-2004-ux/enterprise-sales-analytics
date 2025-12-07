/**
 * scripts/chunked_copy_orchestrator.js
 *
 * Node.js script to split a large CSV into chunks and orchestrate their import into Postgres (via Docker).
 * Requirements: Node.js >= 14
 *
 * Usage:
 *   node scripts/chunked_copy_orchestrator.js --input ./data/dataset_for_copy.csv --out-dir ./data/chunks --execute true
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');
const os = require('os');

// ==========================================
// CONFIG & DEFAULTS
// ==========================================
const ARGS = parseArgs();
const INPUT_FILE = ARGS.input || path.join(__dirname, '../data/dataset_for_copy.csv');
const OUTPUT_DIR = ARGS.outDir || path.join(__dirname, '../data/chunks');
const CHUNK_SIZE = parseInt(ARGS.chunkSize || process.env.CHUNK_SIZE || '200000', 10);
const CONTAINER = ARGS.container || 'postgres_db'; // Default container name, adjust if needed
const EXECUTE = ARGS.execute === 'true'; // Set to true to verify execution
const YES = ARGS.yes === 'true'; // Auto-confirm

// ==========================================
// MAIN EXECUTION
// ==========================================
(async () => {
    console.log('==================================================');
    console.log('   CHUNKED CSV INGESTION ORCHESTRATOR');
    console.log('==================================================');
    console.log(`Input:      ${INPUT_FILE}`);
    console.log(`Output Dir: ${OUTPUT_DIR}`);
    console.log(`Chunk Size: ${CHUNK_SIZE} rows`);
    console.log(`Container:  ${CONTAINER}`);
    console.log(`Execute:    ${EXECUTE ? 'YES (Will run commands)' : 'NO (Dry Run)'}`);
    console.log('==================================================\n');

    // 1. Validation
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`[!] Error: Input file not found: ${INPUT_FILE}`);
        process.exit(1);
    }

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`[+] Created directory: ${OUTPUT_DIR}`);
    }

    // 2. Read Header & Split Chunks
    console.log('[*] Reading file and generating chunks...');
    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let header = null;
    let chunkIndex = 0;
    let currentChunkRows = 0;
    let totalRows = 0;
    let chunkWriter = null;
    let chunkPaths = [];

    const startSplitTime = Date.now();

    for await (const line of rl) {
        // Capture header from first line
        if (!header) {
            header = line;
            continue;
        }

        // Start new chunk if needed
        if (currentChunkRows === 0) {
            chunkIndex++;
            const chunkName = `chunk_${String(chunkIndex).padStart(4, '0')}.csv`;
            const chunkPath = path.join(OUTPUT_DIR, chunkName);
            chunkPaths.push(chunkPath);

            // Resume Check (optimization: don't write if file exists? No, we might want to overwrite to ensure consistency)
            // But for splitting, we generally just overwrite or verify.
            // Let's overwrite to be safe.
            chunkWriter = fs.createWriteStream(chunkPath);
            chunkWriter.write(header + '\n'); // Write header
        }

        // Write row
        chunkWriter.write(line + '\n');
        currentChunkRows++;
        totalRows++;

        // Close chunk if full
        if (currentChunkRows >= CHUNK_SIZE) {
            chunkWriter.end();
            currentChunkRows = 0;
            process.stdout.write(`\r[+] Generated Chunk ${chunkIndex} (${CHUNK_SIZE} rows)...`);
        }
    }

    // Close final chunk
    if (chunkWriter && currentChunkRows > 0) {
        chunkWriter.end();
        console.log(`\n[+] Generated Chunk ${chunkIndex} (${currentChunkRows} rows).`);
    } else {
        console.log('');
    }

    const splitDuration = ((Date.now() - startSplitTime) / 1000).toFixed(1);
    console.log(`\n[OK] Splitting Complete.`);
    console.log(`     Total Rows: ${totalRows.toLocaleString()}`);
    console.log(`     Chunks:     ${chunkIndex}`);
    console.log(`     Time:       ${splitDuration}s\n`);

    // 3. Orchestrate Import
    if (EXECUTE && !YES) {
        // Safety prompt
        console.log(`[?] Ready to import ${chunkIndex} chunks into container '${CONTAINER}'?`);
        console.log(`    This will execute 'docker cp' and 'docker exec' commands.`);
        await promptUser('    Press ENTER to continue or Ctrl+C to cancel...');
    }

    console.log('==================================================');
    console.log('   IMPORTING CHUNKS');
    console.log('==================================================');

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const chunkPath of chunkPaths) {
        const chunkName = path.basename(chunkPath);
        const doneMarker = chunkPath + '.done';

        // Resume check
        if (EXECUTE && fs.existsSync(doneMarker)) {
            console.log(`[Skip] ${chunkName} (Found .done marker)`);
            skipCount++;
            continue;
        }

        console.log(`\n[Processing] ${chunkName}`);

        // Prepare Commands
        // We copy to /tmp inside container
        const containerPath = `/tmp/${chunkName}`;

        // NOTE: We assume the table is 'sales'. Using header logic to get columns is safest.
        // But for COPY command we need comma-separated columns list.
        // We will assume the header is comma-separated (CSV).
        // If header contains quotes, we might need parsing, but for our dataset we know it's clean headers.
        const columns = header.replace(/"/g, '').trim();

        // Docker CP Command
        // Handle Windows paths for docker cp: output path must be standard.
        // On Windows child_process, source path can be normal.
        const cmdCp = `docker cp "${chunkPath}" ${CONTAINER}:${containerPath}`;

        // Docker Exec COPY Command
        const copySql = `\\copy sales(${columns}) FROM '${containerPath}' WITH (FORMAT csv, HEADER true, NULL '')`;
        const cmdExec = `docker exec -i ${CONTAINER} psql -U postgres -d postgres -c "${copySql.replace(/"/g, '\\"')}"`;

        // PowerShell equivalent for display
        const psCmdCp = `docker cp "${chunkPath}" ${CONTAINER}:${containerPath}`;
        const psCmdExec = `docker exec -i ${CONTAINER} psql -U postgres -d postgres -c "${copySql.replace(/"/g, '`"')}"`;

        if (!EXECUTE) {
            // DRY RUN: Print commands
            console.log('  Bash:');
            console.log(`    ${cmdCp}`);
            console.log(`    ${cmdExec}`);
            console.log('  PowerShell:');
            console.log(`    ${psCmdCp}`);
            console.log(`    ${psCmdExec}`);
        } else {
            // EXECUTE
            try {
                // Step A: Copy
                process.stdout.write('  Action: Copying to container... ');
                runCommand(cmdCp);
                console.log('Done.');

                // Step B: Import
                process.stdout.write('  Action: Importing into Postgres... ');
                const startImport = Date.now();
                runCommand(cmdExec);
                const duration = ((Date.now() - startImport) / 1000).toFixed(1);
                console.log(`Success (${duration}s).`);

                // Step C: Mark Done
                fs.writeFileSync(doneMarker, new Date().toISOString());
                successCount++;

            } catch (err) {
                console.error(`\n[!] FAILED processing ${chunkName}`);
                console.error(`    Error: ${err.message}`);
                console.error(`    Command Output: ${err.stdout?.toString()} / ${err.stderr?.toString()}`);
                console.error(`\nStopping execution. Fix the issue and re-run (completed chunks will be skipped).`);

                console.log('\nTo retry this chunk manually:');
                console.log(cmdCp);
                console.log(cmdExec);

                process.exit(1);
            }
        }
    }

    // Final Summary
    console.log('\n==================================================');
    console.log('   JOB COMPLETE');
    console.log('==================================================');
    console.log(`Total Chunks: ${chunkPaths.length}`);
    console.log(`Skipped:      ${skipCount}`);
    console.log(`Imported:     ${successCount}`);
    if (!EXECUTE) console.log('(Dry Run - no actions taken)');

})();

// ==========================================
// HELPERS
// ==========================================

function parseArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            // Convert kebab-case to camelCase
            const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
            args[camelKey] = value || process.argv[process.argv.indexOf(arg) + 1] || 'true';
        }
    });
    return args;
}

function runCommand(command) {
    // Basic cross-platform split (caveat: doesn't handle complex quoted args perfectly if strict separation needed)
    // For docker commands in this script, simple split by space is risky if paths have spaces.
    // Better to use shell: true
    const result = spawnSync(command, { shell: true, stdio: 'pipe' });

    if (result.status !== 0) {
        const error = new Error(`Command failed with exit code ${result.status}`);
        error.stdout = result.stdout;
        error.stderr = result.stderr;
        throw error;
    }
    return result;
}

function promptUser(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}
