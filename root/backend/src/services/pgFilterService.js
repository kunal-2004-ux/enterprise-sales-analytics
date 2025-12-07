// backend/src/services/pgFilterService.js
// Builds parameterized SQL queries for /api/sales with keyset and offset fallback.

const SORT_COLUMN_MAP = {
    date: 'date',
    quantity: 'quantity',
    customer_name: 'customer_name',
    total_amount: 'final_amount' // user asked for total_amount in allowed sorts; map to final_amount if appropriate
};

async function querySales(pool, params) {
    const {
        q, region, gender, age_min, age_max, category, tags, payment,
        date_from, date_to, sort_by = 'date', sort_dir = 'desc',
        limit = 10, cursor_date, cursor_id, page, count = false
    } = params;

    // validate sort_by mapping
    const sortColumn = SORT_COLUMN_MAP[sort_by] || 'date';
    const sortDir = (sort_dir && sort_dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    // Build base filters (no pagination)
    const baseWhere = [];
    const values = [];
    let idx = 1;

    if (q) {
        baseWhere.push(`(customer_name ILIKE $${idx} OR phone ILIKE $${idx})`);
        values.push(`%${q}%`);
        idx++;
    }
    if (region) { baseWhere.push(`customer_region = $${idx}`); values.push(region); idx++; }
    if (gender) { baseWhere.push(`gender = $${idx}`); values.push(gender); idx++; }
    if (category) { baseWhere.push(`category = $${idx}`); values.push(category); idx++; }
    if (payment) { baseWhere.push(`payment_method = $${idx}`); values.push(payment); idx++; }
    if (age_min !== undefined) { baseWhere.push(`age >= $${idx}`); values.push(age_min); idx++; }
    if (age_max !== undefined) { baseWhere.push(`age <= $${idx}`); values.push(age_max); idx++; }
    if (date_from) { baseWhere.push(`date >= $${idx}`); values.push(date_from); idx++; }
    if (date_to) { baseWhere.push(`date <= $${idx}`); values.push(date_to); idx++; }
    if (tags && Array.isArray(tags) && tags.length > 0) {
        baseWhere.push(`tags && $${idx}::text[]`);
        values.push(tags);
        idx++;
    }

    const baseWhereSql = baseWhere.length ? `WHERE ${baseWhere.join(' AND ')}` : '';

    // If requested, run count on base filters (explicit)
    let totalItems = null;
    if (count) {
        const countSql = `SELECT COUNT(*)::bigint AS total FROM sales ${baseWhereSql}`;
        const cRes = await pool.query(countSql, values);
        totalItems = parseInt(cRes.rows[0].total, 10);
    }

    // Prepare final query filters (copy of base)
    const finalWhere = [...baseWhere];
    const finalValues = [...values];
    let finalIdx = idx;

    const meta = { limit };

    // Keyset pagination only supported reliably when sorting by date (we enforce)
    const useKeyset = (cursor_date !== undefined && cursor_id !== undefined && sort_by === 'date');

    if (useKeyset) {
        // For DESC: date < cursor_date OR (date = cursor_date AND id < cursor_id)
        // For ASC: date > cursor_date OR (date = cursor_date AND id > cursor_id)
        const op = sortDir === 'DESC' ? '<' : '>';
        finalWhere.push(`(date ${op} $${finalIdx} OR (date = $${finalIdx} AND id ${op} $${finalIdx + 1}))`);
        finalValues.push(cursor_date, cursor_id);
        finalIdx += 2;
    }

    const finalWhereSql = finalWhere.length ? `WHERE ${finalWhere.join(' AND ')}` : '';

    // ORDER BY safe columns only
    // Always include id as secondary sort to make ordering deterministic
    const orderSql = `ORDER BY ${sortColumn} ${sortDir}, id ${sortDir}`;

    // Limit (parameterized)
    finalValues.push(limit);
    const limitPlaceholder = `$${finalIdx}`;
    finalIdx++;

    let sql = '';
    let rows;

    if (!useKeyset && page) {
        // OFFSET fallback
        const offset = (page - 1) * limit;
        sql = `SELECT * FROM sales ${finalWhereSql} ${orderSql} LIMIT ${limitPlaceholder} OFFSET ${offset}`;
        const res = await pool.query(sql, finalValues);
        rows = res.rows;
        meta.page = page;
        meta.warning = 'Offset pagination used. Prefer keyset cursor for deep paging.';
    } else {
        // Keyset or simple LIMIT without offset
        sql = `SELECT * FROM sales ${finalWhereSql} ${orderSql} LIMIT ${limitPlaceholder}`;
        const res = await pool.query(sql, finalValues);
        rows = res.rows;
    }

    // Attach cursor meta if rows present and keyset allowed (or even otherwise)
    if (rows.length > 0) {
        const last = rows[rows.length - 1];
        // format date string if it's a Date object
        const lastDate = last.date instanceof Date ? last.date.toISOString().split('T')[0] : last.date;
        meta.cursor = { last_date: lastDate, last_id: last.id };
    }

    if (totalItems !== null) meta.total_items = totalItems;

    return { meta, data: rows };
}

module.exports = { querySales };
