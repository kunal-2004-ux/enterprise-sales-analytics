# Sales Analytics Dashboard

## 1. Overview
A full-stack sales analytics dashboard designed to visualize and filter a dataset of 1 million records with high performance. The application utilizes a dense virtualized table on the frontend and optimized PostgreSQL queries on the backend to ensure sub-second response times. It provides a clean, professional interface for analyzing sales trends through dynamic filtering and real-time metrics.

## 2. Tech Stack
- **Language:** JavaScript.
- **Frontend:** React (Vite), React-Window, CSS Modules.
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL (Neon Cloud).

## 3. Search Implementation Summary
Search is implemented using PostgreSQL's `ILIKE` operator for case-insensitive matching against `customer_name` and `phone` columns. A 300ms debounce is applied on the frontend to minimize API calls. Queries include data constraints to maintain performance across the large dataset.

## 4. Filter Implementation Summary
The system supports concurrent filtering by Region, Category, Payment Method, and Date Range. Date filtering features a custom selector for "Specific Date" or "Range" modes. All filters are validated server-side and dynamically constructed into the SQL `WHERE` clause to ensure accurate result subsets.

## 5. Sorting Implementation Summary
Server-side sorting is supported for Date, Amount, Quantity, and Customer Name fields. A secondary sort key (`id`) is enforced in SQL queries to ensure deterministic row ordering, preventing data inconsistencies or row shifting during pagination.

## 6. Pagination Implementation Summary
Offset-based pagination is used to support numbered navigation controls. The backend accepts `page` and `limit` parameters to calculate the SQL `OFFSET`. Frontend state management ensures pagination resets to page 1 whenever filter criteria change to prevent empty views.

## 7. Setup Instructions
1. **Database:** Ensure PostgreSQL is running.
2. **Backend:** Navigate to `root/backend`, run `npm install` then `npm start`.
3. **Frontend:** Navigate to `root/frontend`, run `npm install` then `npm run dev`.
