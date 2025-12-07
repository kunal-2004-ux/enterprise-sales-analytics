import React from 'react';

/**
 * PaginationFooter.jsx
 * Sticky footer for navigation controls.
 */
export default function PaginationFooter({ meta, onNext, onPrev }) {
    const { prevExists, cursor, limit = 20 } = meta;
    const hasNext = !!cursor;

    return (
        <div className="pagination-footer">
            <span className="pagination-info">
                {/* Simplified Showing Text */}
                Showing results per page: {limit}
            </span>

            <div className="pagination-actions">
                <button
                    className="btn-page"
                    onClick={onPrev}
                    disabled={!prevExists}
                    aria-label="Previous Page"
                >
                    &larr; Prev
                </button>
                <div className="divider-vertical" />
                <button
                    className="btn-page"
                    onClick={onNext}
                    disabled={!hasNext}
                    aria-label="Next Page"
                >
                    Next &rarr;
                </button>
            </div>
        </div>
    );
}
