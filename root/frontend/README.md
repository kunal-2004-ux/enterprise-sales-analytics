# Sales Analytics Frontend

The client-side application for the Sales Analytics Dashboard. Built with React and Vite, this application focuses on performance and usability when handling large datasets.

## Key Features
*   **Virtualization:** Utilizes `react-window` to efficiently render the data table. This allows the application to scroll smoothly through 1 million records without DOM overload.
*   **Dynamic Filtering:** The `FilterToolbar` component dynamically updates based on user input, supporting date ranges, multi-select dropdowns, and search text.
*   **Real-time Metrics:** summary cards (`MetricWidgets`) automatically recalculate totals (Units, Amount, Discount) reflecting the currently filtered dataset.
*   **Responsive Design:** A custom CSS layout ensures the dashboard fits various screen sizes, with a sticky footer for pagination controls.

## Project Structure
*   `src/components`: Reusable UI components (DataTable, Filters, Metrics).
*   `src/hooks`: Custom hooks like `useSalesData` for managing API state and data fetching.
*   `src/services`: API integration layer for communicating with the backend.
*   `src/styles`: Global variables and component-specific styles.

## Setup
1.  Install dependencies: `npm install`
2.  Start development server: `npm run dev`
3.  Build for production: `npm run build`
