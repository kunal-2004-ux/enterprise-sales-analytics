import React, { useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

/**
 * DenseDataTable.jsx
 * Virtualized table for high performance with measured width.
 */

// Filtered Column Config based on user screenshot
const COLUMNS = [
    { label: 'Transaction ID', key: 'transaction_id', width: 140 },
    { label: 'Date', key: 'date', width: 120 },
    { label: 'Customer ID', key: 'customer_id', width: 100 },
    { label: 'Customer Name', key: 'customer_name', width: 160 },
    { label: 'Phone Number', key: 'phone', width: 120 },
    { label: 'Gender', key: 'gender', width: 80 },
    { label: 'Age', key: 'age', width: 60 },
    { label: 'Product Category', key: 'category', width: 140 },
    { label: 'Quantity', key: 'quantity', width: 80 },
    { label: 'Total Amount', key: 'total_amount', width: 100 },
    { label: 'Customer Region', key: 'customer_region', width: 130 },
    { label: 'Product ID', key: 'product_id', width: 100 },
    { label: 'Employee Name', key: 'salesperson_name', width: 160 }
];

const Row = ({ index, style, data }) => {
    const item = data[index];
    if (!item) return <div style={style}>Loading...</div>;

    const getVal = (col) => {
        const val = item[col.key];
        if (val !== undefined && val !== null) return val;
        return '';
    };

    return (
        <div style={style} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
            {COLUMNS.map((col, idx) => (
                <div key={idx} className="table-cell" style={{ width: col.width, minWidth: col.width }}>
                    {getVal(col)}
                </div>
            ))}
        </div>
    );
};

export default function DenseDataTable({ data = [], loading }) {
    const wrapperRef = useRef(null);
    const headerRef = useRef(null);
    const listOuterRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(800);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const update = () => {
            setContainerWidth(el.clientWidth || 800);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Sync header scroll with list scroll
    useEffect(() => {
        const listEl = listOuterRef.current;
        if (!listEl) return;

        const handleScroll = () => {
            if (headerRef.current) {
                headerRef.current.scrollLeft = listEl.scrollLeft;
            }
        };

        listEl.addEventListener('scroll', handleScroll);
        return () => listEl.removeEventListener('scroll', handleScroll);
    }, [loading, data]); // Re-attach if list remounts

    // total width of columns
    const totalWidth = COLUMNS.reduce((s, c) => s + c.width, 0);

    if (!loading && (!data || data.length === 0)) {
        return <div className="no-records">No records found.</div>;
    }

    // Row wrapper to force width
    const RowWrapper = ({ index, style, data }) => {
        // Force the row width to match total column width, enabling horizontal scroll in List
        const rowStyle = {
            ...style,
            width: totalWidth,
            minWidth: totalWidth
        };
        return <Row index={index} style={rowStyle} data={data} />;
    };

    return (
        <div className="dense-table-container" ref={wrapperRef} style={{ overflow: 'hidden' }}>
            {/* Header: Hidden overflow, scrolled via JS */}
            <div
                className="table-header"
                ref={headerRef}
                style={{ width: containerWidth, overflow: 'hidden', minWidth: 'auto' }}
            >
                <div style={{ width: totalWidth, display: 'flex' }}>
                    {COLUMNS.map((col, idx) => (
                        <div key={idx} className="header-cell" style={{ width: col.width, minWidth: col.width }}>
                            {col.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Body: Auto overflow (scrolls X and Y) */}
            <div className="table-body" style={{ width: containerWidth }}>
                <List
                    height={Math.min(600, (data.length || 0) * 40 + 20)}
                    itemCount={data.length}
                    itemSize={40}
                    width={containerWidth} // constrained to container
                    itemData={data}
                    outerRef={listOuterRef}
                    style={{ overflow: 'auto' }} // Ensure scrollbars
                >
                    {RowWrapper}
                </List>
            </div>
        </div>
    );
}
