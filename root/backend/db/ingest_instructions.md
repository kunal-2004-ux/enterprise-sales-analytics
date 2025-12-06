# Ingestion Instructions

1.  **Start Postgres**:
    ```bash
    docker run --name pg-sales -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15-alpine
    ```

2.  **Create Schema**:
    ```bash
    # From root/backend (assumes psql installed)
    psql "postgresql://postgres:password@localhost:5432/postgres" -f db/migrations/001_create_sales.sql
    ```

3.  **Generate CSV**:
    ```bash
    # Generates data/dataset_for_copy.csv
    node db/ndjson_to_csv.js
    ```

4.  **Load Data**:
    ```bash
    # Run in psql
    \copy sales(transaction_id, date, customer_id, customer_name, phone, gender, age, customer_region, customer_type, product_id, product_name, brand, category, tags, quantity, price_per_unit, discount_percentage, total_amount, final_amount, payment_method, order_status, delivery_type, store_id, store_location, salesperson_id, salesperson_name) FROM '../data/dataset_for_copy.csv' WITH CSV HEADER;
    ```

5.  **Index**:
    ```bash
    psql "postgresql://postgres:password@localhost:5432/postgres" -f db/migrations/002_create_indexes.sql
    ```

6.  **Analyze**:
    ```sql
    VACUUM ANALYZE sales;
    ```
