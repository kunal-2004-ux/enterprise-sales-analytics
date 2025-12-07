import React from 'react';
import useSalesData from '../hooks/useSalesData';
import FilterToolbar from '../components/FilterToolbar';
import MetricWidgets from '../components/MetricWidgets';
import DenseDataTable from '../components/DenseDataTable';
import PaginationFooter from '../components/PaginationFooter';

export default function DashboardPage() {
    const {
        data, meta, loading, error, params,
        updateFilters, resetFilters, goNextCursor, goPrevCursor
    } = useSalesData();

    return (
        <div className="dashboard-container">
            {/* Top Header */}
            <header className="app-header">
                <div className="app-branding">
                    <div className="app-logo">SalesAI</div>
                    <h1 className="app-title">Sales Management System</h1>
                </div>
                <div className="header-actions">
                    {/* Placeholder for user profile or settings */}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="main-content">

                {/* 1. Filter Toolbar */}
                <section className="toolbar-section">
                    <FilterToolbar onApply={updateFilters} onReset={resetFilters} />
                </section>

                {/* 2. Metrics */}
                <section className="metrics-section">
                    <MetricWidgets data={data} meta={meta} />
                </section>

                {/* 3. Data Table */}
                <section className="table-section">
                    {error && <div className="error-banner">{error}</div>}

                    <div className="table-wrapper">
                        <DenseDataTable data={data} loading={loading} />
                    </div>

                    {/* 4. Footer */}
                    <PaginationFooter
                        meta={meta}
                        onNext={goNextCursor}
                        onPrev={goPrevCursor}
                    />
                </section>
            </main>
        </div>
    );
}
