/**
 * MetricWidgets.jsx
 * Inline metrics mirroring Figma design cards.
 */
import { useMemo } from 'react';

export default function MetricWidgets({ data, meta }) {
    const stats = useMemo(() => {
        const currentRows = data || [];

        // Sum of Quantity on current page
        const units = currentRows.reduce((sum, r) => sum + (parseInt(r.quantity) || 0), 0);

        // Sum of Final Amount on current page
        const sales = currentRows.reduce((sum, r) => sum + (parseFloat(r.final_amount) || 0), 0);

        // Sum of Total Amount (Price * Qty) to calculate discount
        const totalRaw = currentRows.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);

        // Discount = TotalRaw - Sales
        const discount = totalRaw - sales;

        return {
            units,
            sales,
            discount
        };
    }, [data]);

    return (
        <div className="metric-widgets">
            <div className="widget-card">
                <span className="widget-label">Total Units</span>
                <div className="widget-value">{stats.units}</div>
                <div className="widget-caption">on current page</div>
            </div>
            <div className="widget-card">
                <span className="widget-label">Total Amount</span>
                <div className="widget-value">₹{stats.sales.toFixed(2)}</div>
                <div className="widget-caption">on current page</div>
            </div>
            <div className="widget-card">
                <span className="widget-label">Total Discount</span>
                <div className="widget-value">₹{stats.discount.toFixed(2)}</div>
                <div className="widget-caption">on current page</div>
            </div>
        </div>
    );
}
