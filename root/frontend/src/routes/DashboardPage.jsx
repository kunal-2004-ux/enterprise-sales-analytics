import React, { useMemo } from 'react';
import { useSalesData } from '../hooks/useSalesData';
import FiltersPanel from '../components/FiltersPanel';
import SummaryCards from '../components/SummaryCards';
import DataTable from '../components/DataTable';
import PaginationControls from '../components/PaginationControls';

export default function DashboardPage() {
    const { data, meta, loading, error, params, updateFilters, goNextCursor, goPrevCursor, goPage } = useSalesData();

    const handleSort = (column, dir) => {
        updateFilters({ sort_by: column, sort_dir: dir });
    };

    // Derive stats from current data logic 
    const stats = useMemo(() => {
        if (!data || data.length === 0) return {};
        // calculate stats from current page data
        const totalSales = data.reduce((sum, row) => sum + parseFloat(row.final_amount || 0), 0);
        const totalOrders = data.length;
        const avgOrderValue = totalOrders ? totalSales / totalOrders : 0;
        const distinctCustomers = new Set(data.map(r => r.customer_name || (r.customer && r.customer.name))).size;

        return {
            totalSales,
            totalOrders: meta.total_items || totalOrders,
            avgOrderValue,
            distinctCustomers
        };
    }, [data, meta]);

    return (
        <div className="dashboard-layout">
            {/* Left Column */}
            <aside>
                <FiltersPanel onFiltersChanged={(filters) => updateFilters(filters)} />
            </aside>

            {/* Right Column */}
            <main>
                {error && <div style={{ marginBottom: 16, color: 'red', fontWeight: 'bold' }}>Error: {error}</div>}

                <SummaryCards stats={stats} />

                <DataTable
                    data={data}
                    loading={loading}
                    onSort={handleSort}
                    currentSort={params.sort_by}
                    sortDir={params.sort_dir}
                />

                <PaginationControls
                    meta={meta}
                    onNextCursor={goNextCursor}
                    onPrevCursor={goPrevCursor}
                    onPageChange={goPage}
                />
            </main>
        </div>
    );
}
