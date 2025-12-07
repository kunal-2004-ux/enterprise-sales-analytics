/**
 * useSalesData.js
 * Custom hook to manage sales data state, pagination, and filtering.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSales } from '../services/salesService';

export default function useSalesData() {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Active query parameters (filters, sort, pagination)
    const [params, setParams] = useState({
        limit: 10, // Dense table can show more rows
        sort_by: 'date',
        sort_dir: 'desc'
    });

    // Stack to track cursor history for "Previous" navigation
    const [cursorStack, setCursorStack] = useState([]);

    const loadData = useCallback(async (currentParams) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchSales(currentParams);
            setData(result.data || []);
            setMeta(result.meta || {});
        } catch (err) {
            console.error('Data load error:', err);
            setError(err.message || 'Failed to load data');
            setData([]);
            setMeta({});
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and updates when params change
    useEffect(() => {
        loadData(params);
    }, [params, loadData]);

    /**
     * Applies new filters or sort orders.
     * Resets pagination (cursor stack) because the result set changes.
     */
    const updateFilters = (newFilters) => {
        setCursorStack([]); // Reset history
        setParams(prev => {
            // Remove existing pagination keys when filtering
            const { cursor_date, cursor_id, page, ...rest } = prev;
            return {
                ...rest,
                ...newFilters
            };
        });
    };

    /**
     * Resets all filters to defaults.
     */
    const resetFilters = () => {
        setCursorStack([]);
        setParams({
            limit: 10,
            sort_by: 'date',
            sort_dir: 'desc'
        });
    };

    /**
     * Keyset Pagination: Go to Next Page
     * Uses the 'cursor' from the current metadata.
     */
    const goNextCursor = () => {
        if (meta && meta.cursor) {
            // Push current cursor params (or lack thereof) to stack before moving
            const currentCursorState = {
                cursor_date: params.cursor_date,
                cursor_id: params.cursor_id
            };
            setCursorStack(prev => [...prev, currentCursorState]);

            setParams(prev => ({
                ...prev,
                cursor_date: meta.cursor.last_date,
                cursor_id: meta.cursor.last_id,
                page: undefined // Ensure we are in cursor mode
            }));
        }
    };

    /**
     * Keyset Pagination: Go to Previous Page
     * Pops from cursor stack.
     */
    const goPrevCursor = () => {
        setCursorStack(prev => {
            const newStack = [...prev];
            if (newStack.length === 0) return prev;

            const prevCursorState = newStack.pop();
            setParams(p => ({
                ...p,
                cursor_date: prevCursorState.cursor_date,
                cursor_id: prevCursorState.cursor_id,
                page: undefined
            }));
            return newStack;
        });
    };

    /**
     * Offset Pagination: Go to specific page
     * (Fallback if keyset not used)
     */
    const goPage = (pageNum) => {
        setCursorStack([]); // Switching to offset mode clears cursor history
        setParams(prev => ({
            ...prev,
            page: pageNum,
            cursor_date: undefined,
            cursor_id: undefined
        }));
    };

    return {
        data,
        meta: { ...meta, prevExists: cursorStack.length > 0 },
        loading,
        error,
        params,
        updateFilters, // Use this for Apply logic
        resetFilters,
        goNextCursor,
        goPrevCursor,
        goPage
    };
}
