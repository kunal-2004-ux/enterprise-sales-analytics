# Scripts for Data Processing (backend/scripts)

## csvToNdjson.js
This script converts the CSV dataset to NDJSON (newline-delimited JSON) in a streaming, memory-efficient way.

### Location
`backend/scripts/csvToNdjson.js`

### Input
`prod_project/root/data/dataset.csv`

### Output
`prod_project/root/data/dataset.ndjson` (one JSON object per line)

### Usage
From the repository root (`prod_project/root`):
```bash
cd backend
npm install csv-parser
node scripts/csvToNdjson.js
```

### Notes

The script logs progress every 50,000 rows.

It skips rows missing required fields:
- Transaction ID
- Date
- Customer ID
- Customer Name
- Final Amount

NDJSON is recommended for very large datasets because it is streamable and append-friendly.

### After conversion

Verify the NDJSON line count:
- Linux/mac: `wc -l data/dataset.ndjson`
- Windows PowerShell: use `Get-Content` with caution for very large files (or use `Measure-Object -Line`).

Convert NDJSON → CSV for fastest Postgres ingestion with COPY, or ingest via a streaming COPY approach.
