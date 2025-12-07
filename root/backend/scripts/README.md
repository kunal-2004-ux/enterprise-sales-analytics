# Bulk Data Ingestion Pipeline

This directory contains scripts to safely ingest large CSV datasets (1M+ rows) into PostgreSQL.

## Overview

The pipeline operates in three stages to ensure data integrity and low memory usage:
1.  **Stream & Validate**: `dataset.csv` -> `csvToNdjson.js` -> `dataset.ndjson`
    - Parses CSV row-by-row.
    - Normalizes data types (numbers, dates).
    - Validates required fields.
2.  **Format for COPY**: `dataset.ndjson` -> `ndjson_to_copy_csv.js` -> `dataset_for_copy.csv`
    - Flattens nested JSON objects to table columns.
    - Formats arrays for Postgres (`{val1,val2}`).
    - Applies strict CSV escaping.
3.  **Import**: `dataset_for_copy.csv` -> `\copy` command -> Postgres Table
    - Uses Postgres's native `COPY` for maximum speed.

## Prerequisites

- Node.js (v14+)
- PostgreSQL Database
- Input file placed at: `backend/data/dataset.csv`

## Usage

### 1. Run the Orchestrator
This script runs the conversion steps and generates the import command. It does **not** execute the import automatically.

```bash
# From backend root
node scripts/ingest_orchestrator.js
```

### 2. Run the Import (Manual)
The orchestrator will output a `\copy` command. Open your PSQL shell and paste it.

Example:
```sql
\copy sales(transaction_id, date, ...) FROM '.../dataset_for_copy.csv' WITH (FORMAT csv, HEADER true, NULL '');
```

### 3. Create Indexes
After the data is loaded, recreate your indexes for query performance:

```sql
\i db/migrations/002_create_indexes.sql
```

## Performance Tuning
For 1M+ rows, consider setting these in your current session before running `\copy`:

```sql
SET maintenance_work_mem = '1GB';
SET max_wal_size = '4GB';
```
