const API_BASE = '/api'; // Proxy should be configured in vite/package.json

export async function fetchSales(params) {
    // Filter out undefined/null/empty params
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            acc[key] = value;
        }
        return acc;
    }, {});

    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(cleanParams)) {
        if (Array.isArray(v)) {
            // comma-separated for tags
            sp.append(k, v.join(','));
        } else {
            sp.append(k, String(v));
        }
    }
    const query = sp.toString();

    const response = await fetch(`${API_BASE}/sales?${query}`);
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to fetch sales data');
    }
    return response.json();
}

export async function fetchFilters() {
    const response = await fetch(`${API_BASE}/filters`);
    if (!response.ok) {
        throw new Error('Failed to fetch filters');
    }
    return response.json();
}
