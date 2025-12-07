# Sales Analytics Dashboard

## 1. Overview
I designed this full-stack application to handle efficient filtering and visualization of a large dataset (1M+ records). My goal was to build a system that remains responsive even under heavy load, so I implemented a dense virtualized table on the frontend and optimized PostgreSQL queries on the backend. I focused on a clean, functional UI that lets users filter by specific dates or ranges and sort data instantly, ensuring the tool is practical for real-world analysis.

## 2. Tech Stack
- **Frontend**: React 18, Vite, React-Window (for virtualization).
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL 16.
- **Infrastructure**: Docker & Docker Compose.

## 3. Search Implementation Summary
I implemented search using PostgreSQL's `ILIKE` operator to support case-insensitive matching.
- **Logic**: The query checks both `customer_name` and `phone` columns using an `OR` condition.
- **Optimization**: I applied the search filter directly at the database level before pagination to ensure that results are accurate across the entire 1M+ rows, not just the current page.
- **Frontend**: I added a 300ms debounce to the search input to prevent excessive API calls while typing.

## 4. Filter Implementation Summary
I built a filtering system that handles multiple criteria simultaneously.
- **Components**: I used standard dropdowns for categorical data (Region, Category, Payment) to keep the UI simple.
- **Date Handling**: I created a custom mode selector that lets users switch between a "Specific Date" (single day) and a "Date Range" (From/To). This makes the interface cleaner than showing two date pickers by default.
- **Validation**: All filter parameters are validated on the backend to prevent SQL injection and ensure data integrity.

## 5. Sorting Implementation Summary
I implemented server-side sorting to guarantee correct ordering across all pages.
- **Features**: Users can sort by Date, Amount, Quantity, and Customer Name.
- **Consistency**: I implemented a secondary sort key (`id`) in the SQL query. This ensures that the row order remains deterministic, preventing rows from "jumping" between pages during pagination.
- **Interaction**: The sorting applies instantly when a user selects an option, providing immediate feedback.

## 6. Pagination Implementation Summary
I chose offset-based pagination to support numbered page navigation.
- **Logic**: The backend calculates `LIMIT` and `OFFSET` based on the requested page number.
- **State**: I built a `PaginationControls` component that calculates the total pages from the metadata and generates a smart list of page numbers (e.g., 1, 2, ... 10, 11).
- **Persistence**: I ensured that the pagination state works seamlessly with filters—if you filter by "Electronics", the pagination resets to confirm you see the correct count of filtered results.

## 7. Setup Instructions
**Prerequisites**: Node.js (v18+), PostgreSQL, or Docker.

**Using Docker**:
1. `docker-compose up --build -d`
2. Frontend: `http://localhost:5173`
3. Backend: `http://localhost:3001`

**Manual Setup**:
1. **Database**: Create `sales_db` and structure it using the schema.
2. **Backend**: Run `npm install` && `npm start` in `/backend`.
3. **Frontend**: Run `npm install` && `npm run dev` in `/frontend`.
