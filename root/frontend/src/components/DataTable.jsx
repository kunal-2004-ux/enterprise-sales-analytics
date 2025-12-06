import React from 'react';
import { formatDate, formatCurrency } from '../utils/format';

export default function DataTable({ data, loading, onSort, currentSort, sortDir }) {
    if (loading) {
        return (
            <div className="data-table-container">
                <div className="loading-state">Loading sales data...</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="data-table-container">
                <div className="empty-state">No results found. Try adjusting filters.</div>
            </div>
        );
    }

    const renderSortIndicator = (col) => {
        if (currentSort !== col) return null;
        return sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    const handleHeaderClick = (col) => {
        // toggle dir if same col, else default desc
        let newDir = 'desc';
        if (currentSort === col) {
            newDir = sortDir === 'asc' ? 'desc' : 'asc';
        }
        onSort(col, newDir);
    };

    const getStatus = (row) => {
        if (row.tags && row.tags.includes('Returned')) return <span style={{ color: 'red' }}>Returned</span>;
        return <span style={{ color: 'green' }}>Completed</span>;
    };

    return (
        <div className="data-table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th onClick={() => handleHeaderClick('date')}>Date{renderSortIndicator('date')}</th>
                        <th onClick={() => handleHeaderClick('customer_name')}>Customer Name{renderSortIndicator('customer_name')}</th>
                        <th>Region</th>
                        <th>Product (Category)</th>
                        <th onClick={() => handleHeaderClick('quantity')}>Qty{renderSortIndicator('quantity')}</th>
                        <th onClick={() => handleHeaderClick('total_amount')}>Final Amount{renderSortIndicator('total_amount')}</th>
                        <th>Payment Method</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id}>
                            <td>{formatDate(row.date)}</td>
                            <td>{row.customer_name}</td>
                            <td>{row.customer_region}</td>
                            <td>{row.category}</td>
                            <td>{row.quantity}</td>
                            <td>{formatCurrency(row.final_amount)}</td>
                            <td>{row.payment_method}</td>
                            <td>{getStatus(row)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
