-- 001_create_sales.sql
-- Creates the main 'sales' table for bulk ingestion.
-- Install pg_trgm for efficient text search (e.g. on customer names)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop table strings if it exists to allow clean re-runs (optional but safe for dev)
DROP TABLE IF EXISTS sales;

CREATE TABLE sales (
    id bigserial PRIMARY KEY,
    transaction_id text,
    date date,
    customer_id text,
    customer_name text,
    phone text,
    gender text,
    age int,
    customer_region text,
    customer_type text,
    product_id text,
    product_name text,
    brand text,
    category text,
    tags text[],
    quantity int,
    price_per_unit numeric,
    discount_percentage numeric,
    total_amount numeric,
    final_amount numeric,
    payment_method text,
    order_status text,
    delivery_type text,
    store_id text,
    store_location text,
    salesperson_id text,
    salesperson_name text
);

-- NOTE: Indexes are intentionally omitted here.
-- For optimal performance, load data using COPY first, THEN create indexes (see 002_create_indexes.sql).
