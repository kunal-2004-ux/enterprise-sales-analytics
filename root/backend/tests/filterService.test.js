// backend/tests/filterService.test.js
const { querySales } = require('../src/services/pgFilterService');

// Mock Pool
const mockPool = {
    query: jest.fn()
};

describe('pgFilterService', () => {
    beforeEach(() => {
        mockPool.query.mockClear();
        // Default mock return for generic SELECT
        mockPool.query.mockResolvedValue({ rows: [] });
    });

    test('should build basic query with limit as last parameter', async () => {
        await querySales(mockPool, { limit: 10 });
        const callArgs = mockPool.query.mock.calls[0];
        const sql = callArgs[0];
        const params = callArgs[1];

        expect(sql).toContain('SELECT * FROM sales');
        // limit should be present as parameter (last param when no filters)
        expect(params[params.length - 1]).toBe(10);
    });

    test('should add ILIKE clause for search (q)', async () => {
        await querySales(mockPool, { q: 'Alice', limit: 10 });
        const [sql, params] = mockPool.query.mock.calls[0];

        expect(sql).toContain('(customer_name ILIKE');
        // parameter should contain the wildcarded query
        expect(params).toContain('%Alice%');
    });

    test('should add array overlap for tags', async () => {
        await querySales(mockPool, { tags: ['electronics', 'gadget'], limit: 10 });
        const [sql, params] = mockPool.query.mock.calls[0];

        expect(sql).toContain('tags &&');
        // params should contain the tags array (as one of the params)
        expect(params).toEqual(expect.arrayContaining([['electronics', 'gadget']]));
    });

    test('should execute count query when requested', async () => {
        // First call resolves count, second resolves main query
        mockPool.query
            .mockResolvedValueOnce({ rows: [{ total: '50' }] }) // Count response
            .mockResolvedValueOnce({ rows: [] }); // Main query response

        await querySales(mockPool, { region: 'North', count: true, limit: 10 });

        expect(mockPool.query).toHaveBeenCalledTimes(2);

        // Check first call (Count)
        const [countSql, countParams] = mockPool.query.mock.calls[0];
        expect(countSql.toLowerCase()).toContain('select count(');
        expect(countSql).toContain('FROM sales');
        expect(countSql).toContain('WHERE customer_region = $1');
        expect(countParams).toEqual(['North']);

        // Check second call (Main)
        const [mainSql, mainParams] = mockPool.query.mock.calls[1];
        expect(mainSql).toContain('SELECT * FROM sales');
        // The last param should be the limit
        expect(mainParams[mainParams.length - 1]).toBe(10);
    });

    test('should use keyset pagination SQL when cursors provided', async () => {
        const params = {
            cursor_date: '2023-01-01',
            cursor_id: '100',
            sort_by: 'date',
            sort_dir: 'desc',
            limit: 10
        };
        await querySales(mockPool, params);

        const [sql, p] = mockPool.query.mock.calls[0];
        // Check for keyset logic: date < $N OR (date=$N AND id < $M)
        expect(sql).toMatch(/date\s+<\s+\$\d+/i);
        expect(sql).toMatch(/date\s*=\s*\$\d+\s+AND\s+id\s+<\s*\$\d+/i);
    });
});
