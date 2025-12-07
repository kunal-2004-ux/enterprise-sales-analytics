#!/bin/bash

# scripts/copy_into_postgres.sh
#
# Helper script to execute COPY command from INSIDE the Postgres container.
# This assumes the CSV file is accessible within the container (e.g. mounted at /data_host).
#
# Usage:
#   ./copy_into_postgres.sh --file /data_host/dataset_for_copy.csv --yes

# Defaults
FILE="/data_host/dataset_for_copy.csv"
TABLE="sales"
DB="postgres"
DB_USER="postgres"
HOST="localhost"
PORT="5432"
CONFIRM=true

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --file) FILE="$2"; shift ;;
        --table) TABLE="$2"; shift ;;
        --db) DB="$2"; shift ;;
        --user) DB_USER="$2"; shift ;;
        --host) HOST="$2"; shift ;;
        --port) PORT="$2"; shift ;;
        --yes) CONFIRM=false ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo "=================================================="
echo "   POSTGRES IN-CONTAINER IMPORT HELPER"
echo "=================================================="
echo "Config:"
echo "  File:  $FILE"
echo "  Table: $TABLE"
echo "  DB:    $DB"
echo "  User:  $DB_USER"
echo "=================================================="

# 1. Verify File
if [ ! -f "$FILE" ]; then
    echo "[!] Error: File not found at $FILE"
    echo "    Make sure the volume is mounted correctly (e.g. -v ./data:/data_host)"
    exit 1
fi

# 2. Construct Command
# Explicit definitions of columns for safety
COLUMNS="transaction_id, date, customer_id, customer_name, phone, gender, age, customer_region, customer_type, product_id, product_name, brand, category, tags, quantity, price_per_unit, discount_percentage, total_amount, final_amount, payment_method, order_status, delivery_type, store_id, store_location, salesperson_id, salesperson_name"
COPY_CMD="\copy $TABLE($COLUMNS) FROM '$FILE' WITH (FORMAT csv, HEADER true, NULL '')"

echo "Command to run:"
echo "psql -U $DB_USER -d $DB -c \"...\""
echo "QUERY: $COPY_CMD"
echo ""

# 3. Confirmation
if [ "$CONFIRM" = true ]; then
    read -p "Are you sure you want to run this? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# 4. Execute
START_TIME=$(date +%s)
echo "[*] Executing COPY..."

# PGPASSWORD can be set via env, otherwise psql might prompt/fail if not trusted
# Inside docker container, 'postgres' user is usually trusted from localhost
psql -h "$HOST" -p "$PORT" -U "$DB_USER" -d "$DB" -c "$COPY_CMD"
EXIT_CODE=$?

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $EXIT_CODE -eq 0 ]; then
    echo "[SUCCESS] Import completed in ${DURATION}s."
else
    echo "[!] Import failed with exit code $EXIT_CODE."
fi

exit $EXIT_CODE
