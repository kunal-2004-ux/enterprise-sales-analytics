import React from 'react';
import { formatCurrency } from '../utils/format';

export default function SummaryCards({ stats }) {
    // stats: { totalSales, totalOrders, avgOrderValue, distinctCustomers }
    // Provide defaults
    const { totalSales = 0, totalOrders = 0, avgOrderValue = 0, distinctCustomers = 0 } = stats || {};

    return (
        <div className="summary-cards">
            <div className="card">
                <h3>Total Sales</h3>
                <div className="value">{formatCurrency(totalSales)}</div>
            </div>
            <div className="card">
                <h3>Total Orders</h3>
                <div className="value">{totalOrders.toLocaleString()}</div>
            </div>
            <div className="card">
                <h3>Avg Order Value</h3>
                <div className="value">{formatCurrency(avgOrderValue)}</div>
            </div>
            <div className="card">
                <h3>Distinct Customers</h3>
                <div className="value">{distinctCustomers.toLocaleString()}</div>
            </div>
        </div>
    );
}
