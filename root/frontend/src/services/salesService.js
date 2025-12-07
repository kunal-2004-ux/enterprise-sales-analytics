/**
 * salesService.js
 * API interaction layer for Sales Dashboard.
 * Handles constructing query strings and fetching data/filters.
 */

const API_BASE = import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE : '/api';

/**
 * Serialize params object to query string.
 * Handles arrays (joined by comma) and encoding.
 */
const toQueryString = (params) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined || value === '') continue;
        if (Array.isArray(value)) {
            if (value.length > 0) {
                sp.append(key, value.join(','));
            }
        } else {
            sp.append(key, String(value));
        }
    }
    return sp.toString();
};

export const fetchSales = async (params = {}) => {
    // Ensure we ask for total count if not explicitly disabled, useful for metrics
    const queryParams = { count: 'true', ...params };
    const qs = toQueryString(queryParams);
    const res = await fetch(`${API_BASE}/sales?${qs}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to fetch sales data');
    }
    return res.json();
};

export const fetchFilters = async () => {
    const res = await fetch(`${API_BASE}/filters`);
    if (!res.ok) {
        throw new Error('Failed to fetch filter options');
    }
    return res.json();
};
