import React from 'react';
import PaginationControls from './PaginationControls';

/**
 * PaginationFooter.jsx
 * Sticky footer for navigation controls.
 */
export default function PaginationFooter({ meta, onPageChange }) {
    return (
        <div className="pagination-footer">
            <PaginationControls
                meta={meta}
                onPageChange={onPageChange}
            />
        </div>
    );
}
