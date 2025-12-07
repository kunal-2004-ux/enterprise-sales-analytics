import React from 'react';

export default function PaginationControls({ meta = {}, onPageChange }) {
    const { page = 1, total_items, limit = 10 } = meta;

    if (typeof total_items !== 'number') return null;

    const totalPages = Math.ceil(total_items / limit);
    if (totalPages <= 1) return null;

    // Helper to generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxButtons = 5; // Max page buttons to show
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="pagination-controls" style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginTop: '16px' }}>
            <button
                className="btn-page"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                &larr; Prev
            </button>

            {getPageNumbers().map(p => (
                <button
                    key={p}
                    className={`btn-page ${p === page ? 'active' : ''}`}
                    onClick={() => onPageChange(p)}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: p === page ? '#007bff' : '#f0f0f0',
                        color: p === page ? '#fff' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {p}
                </button>
            ))}

            <button
                className="btn-page"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                Next &rarr;
            </button>

            <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#666' }}>
                Total: {totalPages} pages
            </span>
        </div>
    );
}
