# Database Setup & Ingestion

This directory contains resources for setting up the PostgreSQL database and ingesting the sales dataset.

## Workflow

1.  **Start PostgreSQL**: Ensure you have a running Postgres instance.
    ```bash
    # Example Docker command
    docker run --name pg-sales -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
    ```

2.  **Create Table**: Run the initial migration.
    ```bash
    # Example using psql
    psql "postgresql://postgres:mysecretpassword@localhost:5432/postgres" -f db/migrations/001_create_sales.sql
    ```

3.  **Prepare Data**: Convert your processed NDJSON data back into a COPY-optimized CSV format.
    ```bash
    # Run from backend directory
    node db/ndjson_to_csv.js
    ```
    This creates `dataset_for_copy.csv` in the `data` folder.

4.  **Bulk Load**: Use Postgres `COPY` command for high-speed ingestion.
    ```sql
    -- Run inside psql shell
    \copy sales(transaction_id, date, customer_id, customer_name, phone, gender, age, customer_region, customer_type, product_id, product_name, brand, category, tags, quantity, price_per_unit, discount_percentage, total_amount, final_amount, payment_method, order_status, delivery_type, store_id, store_location, salesperson_id, salesperson_name) FROM '../data/dataset_for_copy.csv' WITH CSV HEADER;
    ```
    *Note: If running psql from a different machine/container, use `\copy` (client-side) instead of `COPY` (server-side).*

5.  **Create Indexes**: Add indexes *after* loading data to speed up the process.
    ```bash
    psql "postgresql://postgres:mysecretpassword@localhost:5432/postgres" -f db/migrations/002_create_indexes.sql
    ```

6.  **Optimize**:
    ```sql
    VACUUM ANALYZE sales;
    ```

## Tips & Pitfalls

*   **Index Creation**: Creating indexes on a large empty table and then filling it is much slower than filling the table first and then creating indexes.
*   **Memory**: Temporarily increase `maintenance_work_mem` in Postgres config during index creation for faster builds (e.g., set to 1GB if RAM permits).
*   **Null Handling**: The `ndjson_to_csv.js` script handles NULLs by leaving CSV fields empty, which `COPY` interprets correctly as NULLs.
*   **Array Formatting**: Postgres expects arrays in `{val1,val2}` format for CSV `COPY`. The helper script handles this conversion for the `tags` column.
