# Sales Analytics Backend

The REST API service for the Sales Analytics application. This service handles data retrieval, complex filtering, and efficient query execution against the PostgreSQL database.

## Technologies
*   **Node.js**: Runtime environment.
*   **Express.js**: Web framework for handling API routes.
*   **PostgreSQL**: Relational database for storing sales data.
*   **pg**: PostgreSQL client for Node.js.

## API Endpoints

### `GET /api/sales`
Fetches a paginated list of sales records based on query parameters.

**Query Parameters:**
*   `page`: Page number (default: 1).
*   `limit`: Records per page (default: 10).
*   `q`: Search term (Customer Name or Phone).
*   `region`, `gender`, `category`: Filter by specific fields.
*   `date_from`, `date_to`: Filter by date range.
*   `sort_by`, `sort_dir`: Sorting field and direction.

### `GET /api/filters`
Retrieves distinct values for filter dropdowns (Region, Category, Payment Method, etc.) to populate the frontend UI dynamically.

## Implementation Details
*   **Pagination:** Implements offset-based pagination to support numbered navigation on the frontend.
*   **Search Optimization:** Uses parameterized SQL queries with `ILIKE` for secure and efficient case-insensitive searching.
*   **Performance:** All distinct value queries include a `LIMIT` clause to prevent performance issues with high-cardinality data.

## Setup
1.  Install dependencies: `npm install`
2.  Configure `.env` with `DATABASE_URL`.
3.  Start the server: `npm start`
