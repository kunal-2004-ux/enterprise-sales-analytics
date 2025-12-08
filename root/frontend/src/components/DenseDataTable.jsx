import React, { useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

/**
 * DenseDataTable.jsx
 * Virtualized table with dynamic height to support horizontal scrolling when zoomed.
 */

// Filtered Column Config
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
        <div style={style} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`} role="row">
            {COLUMNS.map((col, idx) => (
                <div key={idx} className="table-cell" style={{ width: col.width, minWidth: col.width, flexGrow: 1 }}>
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

    // Initialize dimensions
    const [dimensions, setDimensions] = useState({
        width: typeof window !== 'undefined' ? (window.innerWidth - 48) : 800,
        height: 600
    });

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const update = () => {
            const rect = el.getBoundingClientRect();
            // Update width/height to match container
            setDimensions({
                width: rect.width,
                height: rect.height
            });
        };

        // Initial measure
        update();

        // Listen for window resize
        window.addEventListener('resize', update);

        // Also use ResizeObserver for container changes
        const ro = new ResizeObserver(update);
        ro.observe(el);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
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
    }, [loading, data]);

    const totalWidth = COLUMNS.reduce((s, c) => s + c.width, 0);
    // If dimensions.width > totalWidth, we stretch columns. Otherwise we scroll.
    const effectiveWidth = Math.max(totalWidth, dimensions.width);

    if (!loading && (!data || data.length === 0)) {
        return <div className="no-records">No records found.</div>;
    }

    const RowWrapper = ({ index, style, data }) => {
        const rowStyle = {
            ...style,
            width: effectiveWidth,
            minWidth: totalWidth
        };
        return <Row index={index} style={rowStyle} data={data} />;
    };

    // Calculate dynamic list height (container height - header height)
    // Reduce height slightly to ensure scrollbar fits
    const headerHeight = 42;
    const listHeight = Math.max(100, dimensions.height - headerHeight);

    return (
        <div className="dense-table-container" ref={wrapperRef} style={{ overflow: 'hidden', position: 'relative', width: '100%', height: '100%' }}>
            {/* Header */}
            <div
                className="table-header"
                ref={headerRef}
                style={{ width: dimensions.width, overflow: 'hidden', minWidth: 'auto', height: '42px', flexShrink: 0 }}
            >
                <div style={{ width: effectiveWidth, display: 'flex' }}>
                    {COLUMNS.map((col, idx) => (
                        <div key={idx} className="header-cell" style={{ width: col.width, minWidth: col.width, flexGrow: 1 }}>
                            {col.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className="table-body" style={{ width: dimensions.width, flex: 1 }}>
                <List
                    height={listHeight}
                    itemCount={data.length}
                    itemSize={40}
                    width={dimensions.width}
                    itemData={data}
                    outerRef={listOuterRef}
                    style={{ overflowX: 'auto', overflowY: 'auto' }}
                >
                    {RowWrapper}
                </List>
            </div>
        </div>
    );
}
