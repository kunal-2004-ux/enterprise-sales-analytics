import React from 'react';
import useSalesData from '../hooks/useSalesData';
import FilterToolbar from '../components/FilterToolbar';
import MetricWidgets from '../components/MetricWidgets';
import DenseDataTable from '../components/DenseDataTable';
import PaginationFooter from '../components/PaginationFooter';

export default function DashboardPage() {
    const {
        data,
        meta,
        loading,
        params, // Contains current filters
        updateFilters,
        resetFilters,
        goPage
    } = useSalesData();

    return (
        <div className="dashboard-container">
            <header className="app-header">
                <div className="app-branding">
                    <div className="app-title">Enterprise Analytics Dashboard</div>
                </div>
            </header>

            <div className="main-content">
                <FilterToolbar
                    currentFilters={params}
                    onApply={updateFilters}
                    onReset={resetFilters}
                />

                {/* Metrics derived from current view */}
                <MetricWidgets data={data} />

                <div className="table-section">
                    <div className="table-wrapper">
                        <DenseDataTable data={data} loading={loading} />
                    </div>
                </div>

                <PaginationFooter
                    meta={meta}
                    onPageChange={goPage}
                />
            </div>
        </div>
    );
}
