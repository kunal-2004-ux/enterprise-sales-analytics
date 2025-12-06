import { useState, useEffect, useCallback } from 'react';
import { fetchSales } from '../services/salesService';

export function useSalesData() {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for filters and pagination
    const [params, setParams] = useState({
        limit: 10,
        sort_by: 'date',
        sort_dir: 'desc',
        // ...other filters can be merged here
    });

    const [cursorStack, setCursorStack] = useState([]);

    const loadData = useCallback(async (queryParams) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchSales(queryParams);
            setData(result.data || []);
            setMeta(result.meta || {});
        } catch (err) {
            console.error(err);
            setError(err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect to refetch when params change
    useEffect(() => {
        loadData(params);
    }, [params, loadData]);

    const updateFilters = (newFilters) => {
        setCursorStack([]); // Reset stack on filter change
        setParams(prev => {
            const merged = { ...prev, ...newFilters };
            // reset pagination
            delete merged.cursor_date;
            delete merged.cursor_id;
            delete merged.page;
            return merged;
        });
    };

    const goNextCursor = () => {
        if (meta && meta.cursor) {
            // Push current cursor state to stack BEFORE moving, actually we need the cursor that GOT us here?
            // No, we store the cursor we are ABOUT to use to go back?
            // Simpler: store the *current* params cursor config to the stack.
            // But wait, the first page has NO cursor params.
            // So pushing { cursor_date: params.cursor_date, cursor_id: params.cursor_id } is correct.

            setCursorStack(prev => [...prev, {
                cursor_date: params.cursor_date,
                cursor_id: params.cursor_id
            }]);

            setParams(prev => ({
                ...prev,
                cursor_date: meta.cursor.last_date,
                cursor_id: meta.cursor.last_id,
                page: undefined
            }));
        }
    };

    const goPrevCursor = () => {
        setCursorStack(prev => {
            const newStack = [...prev];
            if (newStack.length === 0) return prev; // Should not happen if button disabled

            const lastParams = newStack.pop(); // Get the params of the previous page

            setParams(p => {
                const next = { ...p, page: undefined };
                if (lastParams.cursor_date === undefined) {
                    delete next.cursor_date;
                    delete next.cursor_id;
                } else {
                    next.cursor_date = lastParams.cursor_date;
                    next.cursor_id = lastParams.cursor_id;
                }
                return next;
            });

            return newStack;
        });
    };

    const goPage = (pageNum) => {
        setParams(prev => ({
            ...prev,
            page: pageNum,
            cursor_date: undefined,
            cursor_id: undefined
        }));
    };

    return {
        data,
        meta: { ...meta, prevExists: cursorStack.length > 0 }, // expose if prev exists
        loading,
        error,
        params,
        updateFilters,
        goNextCursor,
        goPrevCursor,
        goPage,
        cursorStack
    };
}
