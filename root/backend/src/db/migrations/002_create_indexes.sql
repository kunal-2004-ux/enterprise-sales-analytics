-- 002_create_indexes.sql
-- Recommended indexes to be created AFTER bulk data loading.

-- Standard B-Tree indexes for efficient filtering and sorting
CREATE INDEX idx_sales_date ON sales (date);
CREATE INDEX idx_sales_region ON sales (customer_region);
CREATE INDEX idx_sales_category ON sales (category);
CREATE INDEX idx_sales_gender ON sales (gender);
CREATE INDEX idx_sales_quantity ON sales (quantity);
CREATE INDEX idx_sales_final_amount ON sales (final_amount);

-- GIN index for efficient array containment queries on 'tags'
-- Example: SELECT * FROM sales WHERE tags @> ARRAY['Electronics'];
CREATE INDEX idx_sales_tags ON sales USING GIN (tags);

-- GIN Trigram index for fuzzy text search on customer names
-- Example: SELECT * FROM sales WHERE customer_name ILIKE '%Smith%';
CREATE INDEX idx_sales_name_trgm ON sales USING gin (customer_name gin_trgm_ops);

-- IMPORTANT: Update statistics for the query planner
ANALYZE sales;
