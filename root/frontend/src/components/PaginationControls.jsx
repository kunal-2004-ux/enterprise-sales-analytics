import React from 'react';

export default function PaginationControls({ meta = {}, onNextCursor, onPrevCursor, onPageChange }) {
    const { cursor, page, total_items, limit = 10, warning, prevExists } = meta;

    // Render warning if mixed mode
    const renderWarning = warning ? <div style={{ fontSize: '0.8rem', color: 'orange', marginRight: '10px' }}>{warning}</div> : null;

    if (cursor || prevExists) {
        return (
            <div className="pagination-controls">
                {renderWarning}
                <span style={{ fontSize: '0.9rem', color: '#666', marginRight: 'auto' }}>
                    Keyset Pagination (Optimized)
                </span>
                <button
                    className="btn-page"
                    onClick={onPrevCursor}
                    disabled={!prevExists}
                >
                    &larr; Prev
                </button>
                <button
                    className="btn-page"
                    onClick={onNextCursor}
                    disabled={!cursor} // Next is disabled if no cursor returned (end of list)
                >
                    Next Page &rarr;
                </button>
            </div>
        );
    }

    if (page) {
        // Only show if page is set (offset mode)
        const hasNext = typeof total_items === 'number' ? (page * limit < total_items) : true;

        return (
            <div className="pagination-controls">
                {renderWarning}
                <button
                    className="btn-page"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    &larr; Prev
                </button>
                <span style={{ fontWeight: 500 }}>Page {page}</span>
                <button
                    className="btn-page"
                    disabled={!hasNext}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next &rarr;
                </button>
            </div>
        );
    }

    // Default / Empty
    return null;
}
