# System Architecture

## 1. Backend Architecture
The backend is built as a lightweight, performance-oriented REST API using Node.js and Express. It connects to a PostgreSQL 16 database.

**Key Design Decisions:**
- **Controller-Service separation**: The route handlers (`salesRoutes.js`) only manage HTTP request/response logic, while the business logic and SQL generation are strictly isolated in `pgFilterService.js`.
- **Parameterized Queries**: All SQL execution uses parameterized queries (`$1, $2...`) to prevent SQL injection.
- **Efficient Filtering**: Instead of using an ORM which might add overhead, I wrote a custom dynamic SQL builder (`pgFilterService.js`) to construct optimized `WHERE` clauses for the complex multi-filter requirements.

## 2. Frontend Architecture
The frontend is a React 18 Single Page Application (SPA) built with Vite for fast tooling.

**Key Components:**
- **Virtualization**: I used `react-window` for the data table (`DenseDataTable.jsx`). This allows the browser to render only the visible rows ~20 items) instead of the thousands potentially fetched, keeping the UI silky smooth 60fps.
- **Custom Hooks**: State management is centralized in `useSalesData.js`. This hook manages the loading states, side effects (data fetching), and filter state, exposing a clean API to the UI components.
- **CSS Modules**: Styling is handled via standard CSS variables for theming, ensuring a consistent look without the bloat of a heavy UI framework.

## 3. Data Flow
1. **User Action**: User updates a filter (e.g., changes Date Range).
2. **State Update**: `FilterToolbar` calls `onApply`, updating the state in `useSalesData` hook.
3. **API Request**: The hook triggers `salesService.fetchSales()`, which constructs a query string (e.g., `?date_from=...&sort_by=date`).
4. **Backend Processing**: `salesRoutes` validates parameters. `pgFilterService` builds the SQL.
5. **Database Execution**: PostgreSQL executes the query (using indexes) and returns the page of results + total count.
6. **UI Render**: React receives the JSON data and updates the `DenseDataTable` and `MetricWidgets` instantly.

## 4. Folder Structure
```
/root
├── backend/
│   ├── src/
│   │   ├── routes/          # API Route definitions
│   │   ├── services/        # Business logic & SQL generation
│   │   └── utils/           # Validation & helpers
│   ├── scripts/             # Data ingestion & migration tools
│   └── app.js               # Express entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # UI Components (Table, Toolbar, Metrics)
│   │   ├── hooks/           # Custom React Hooks (State logic)
│   │   ├── services/        # API Client layer
│   │   ├── styles/          # Global CSS & Variables
│   │   └── routes/          # Page layouts
│   └── vite.config.js       # Build config
└── data/                    # Raw dataset storage
```

## 5. Module Responsibilities
- **`pgFilterService.js` (Backend)**: Single source of truth for converting frontend parameters into secure SQL. Handles specific logic for offset pagination vs keyset pagination.
- **`useSalesData.js` (Frontend)**: The "brain" of the frontend. It coordinates the URL params, API calls, and loading states so the UI components can remain "dumb" and focused only on display.
- **`DenseDataTable.jsx` (Frontend)**: Responsible solely for efficiency. It measures the screen width and virtualizes the rows, ensuring the application scales to any screen size.
- **`validate.js` (Backend)**: Gatekeeper for the API. Ensures no invalid data types (like letters in a numeric price field) ever reach the database query layer.
