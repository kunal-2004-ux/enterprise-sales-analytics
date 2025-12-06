/**
 * Validates and sanitizes query parameters for sales filtering.
 * Returns sanitized params or throws { status, message } errors.
 */

const ALLOWED_SORTS = ['date', 'quantity', 'customer_name', 'total_amount'];

function isValidDateStr(s) {
    if (!s) return false;
    const d = new Date(s);
    return !isNaN(d.getTime());
}

function parseAndValidateQuery(query) {
    const params = {};

    // q: free text
    if (query.q) {
        if (typeof query.q !== 'string') throw { status: 400, message: "Invalid 'q' parameter" };
        params.q = query.q.trim();
    }

    // simple string filters
    ['region', 'gender', 'category', 'payment'].forEach(f => {
        if (query[f]) params[f] = String(query[f]).trim();
    });

    // age ranges
    if (query.age_min) {
        const v = parseInt(query.age_min, 10);
        if (Number.isNaN(v)) throw { status: 400, message: "Invalid 'age_min'" };
        params.age_min = v;
    }
    if (query.age_max) {
        const v = parseInt(query.age_max, 10);
        if (Number.isNaN(v)) throw { status: 400, message: "Invalid 'age_max'" };
        params.age_max = v;
    }

    // tags: accept CSV string or array
    if (query.tags) {
        if (Array.isArray(query.tags)) {
            params.tags = query.tags.map(String).map(s => s.trim()).filter(Boolean);
        } else {
            params.tags = String(query.tags).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (params.tags.length === 0) delete params.tags;
    }

    // dates
    if (query.date_from) {
        if (!isValidDateStr(query.date_from)) throw { status: 400, message: "Invalid 'date_from' format (expected YYYY-MM-DD)" };
        params.date_from = query.date_from;
    }
    if (query.date_to) {
        if (!isValidDateStr(query.date_to)) throw { status: 400, message: "Invalid 'date_to' format (expected YYYY-MM-DD)" };
        params.date_to = query.date_to;
    }

    // sort
    if (query.sort_by) {
        if (!ALLOWED_SORTS.includes(query.sort_by)) {
            throw { status: 400, message: `Invalid sort_by. Allowed: ${ALLOWED_SORTS.join(', ')}` };
        }
        params.sort_by = query.sort_by;
    } else {
        params.sort_by = 'date';
    }
    if (query.sort_dir) {
        const d = String(query.sort_dir).toLowerCase();
        if (!['asc', 'desc'].includes(d)) throw { status: 400, message: "Invalid sort_dir (asc|desc)" };
        params.sort_dir = d;
    } else {
        params.sort_dir = 'desc';
    }

    // limit
    if (query.limit) {
        const lim = parseInt(query.limit, 10);
        if (Number.isNaN(lim) || lim < 1 || lim > 100) throw { status: 400, message: "limit must be integer between 1 and 100" };
        params.limit = lim;
    } else {
        params.limit = 10;
    }

    // page (offset fallback)
    if (query.page) {
        const p = parseInt(query.page, 10);
        if (Number.isNaN(p) || p < 1) throw { status: 400, message: "page must be integer >= 1" };
        params.page = p;
    }

    // cursor
    if (query.cursor_date) {
        if (!isValidDateStr(query.cursor_date)) throw { status: 400, message: "Invalid cursor_date" };
        params.cursor_date = query.cursor_date;
    }
    if (query.cursor_id) {
        // ensure integer-like
        const idNum = parseInt(query.cursor_id, 10);
        if (Number.isNaN(idNum)) throw { status: 400, message: "Invalid cursor_id (must be integer)" };
        params.cursor_id = idNum;
    }

    if (query.count === 'true' || query.count === true) params.count = true;

    return params;
}

module.exports = { parseAndValidateQuery };
