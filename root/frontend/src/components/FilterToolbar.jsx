import { useState, useEffect, useRef } from 'react';
import { fetchFilters } from '../services/salesService';

/**
 * FilterToolbar.jsx
 * Horizontal toolbar mimicking Figma design.
 * Features:
 * - Debounced search input (center)
 * - Dropdowns for Region, Gender, Category, Payment, Age, Tags
 * - Sort options with "Sort by:" prefix
 * - Apply/Reset buttons
 */
export default function FilterToolbar({ onApply, onReset }) {
    const [options, setOptions] = useState({
        region: [], gender: [], category: [], payment: [], tags: [] // ensure 'tags' exists
    });
    const [dateMode, setDateMode] = useState('all');

    // Local filter state (draft)
    const [filters, setFilters] = useState({
        q: '',
        region: '',
        gender: '',
        age_range: '', // 'min-max' string
        category: '',
        payment: '',
        tags: '',     // single selected tag from dropdown
        date_from: '',
        date_to: '',
        specific_date: '',
        sort_by: 'date',
        sort_dir: 'desc'
    });

    // Debounce search
    const debounceTimer = useRef(null);

    useEffect(() => {
        let mounted = true;
        fetchFilters().then(data => {
            if (mounted && data) {
                // Merge to avoid initial undefined states
                setOptions(prev => ({ ...prev, ...data }));
            }
        }).catch(err => console.error('Filter fetch error', err));
        return () => mounted = false;
    }, []);

    const handleChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);

        // Instant apply for search (with debounce)
        if (field === 'q') {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                onApply({ q: value }); // Only send q update
            }, 300);
        }
    };

    const handleApply = () => {
        // Prepare payload
        const payload = { ...filters };

        // Handle Age Range
        if (payload.age_range) {
            const [min, max] = payload.age_range.split('-');
            if (min) payload.age_min = min;
            if (max && max !== 'plus') payload.age_max = max;
        }

        // Handle Tags (Dropdown select -> Array)
        if (payload.tags) {
            payload.tags = [payload.tags]; // API expects array
        } else {
            payload.tags = [];
        }

        delete payload.age_range; // don't send internal range string
        delete payload.specific_date; // internal UI state only
        onApply(payload);
    };

    const handleReset = () => {
        const resetState = {
            q: '', region: '', gender: '', age_range: '', category: '', payment: '', tags: '',
            date_from: '', date_to: '', specific_date: '',
            sort_by: 'date', sort_dir: 'desc'
        };
        setFilters(resetState);
        setDateMode('all');
        onReset();
    };

    return (
        <div className="filter-toolbar">
            {/* Left: Filters */}
            <div className="filter-group-left">
                {/* Refresh Icon Button Placeholder */}
                <button className="btn-icon" onClick={handleReset} title="Refresh / Reset">
                    ↻
                </button>

                <select
                    value={filters.region}
                    onChange={e => handleChange('region', e.target.value)}
                    aria-label="Customer Region"
                >
                    <option value="">Customer Region</option>
                    {options.region?.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select
                    value={filters.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                    aria-label="Gender"
                >
                    <option value="">Gender</option>
                    {options.gender?.map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                <select
                    value={filters.age_range}
                    onChange={e => handleChange('age_range', e.target.value)}
                    aria-label="Age Range"
                >
                    <option value="">Age Range</option>
                    <option value="18-25">18-25</option>
                    <option value="26-35">26-35</option>
                    <option value="36-45">36-45</option>
                    <option value="46-60">46-60</option>
                    <option value="60-plus">60+</option>
                </select>

                <select
                    value={filters.category}
                    onChange={e => handleChange('category', e.target.value)}
                    aria-label="Category"
                >
                    <option value="">Product Category</option>
                    {options.category?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                    value={filters.tags}
                    onChange={e => handleChange('tags', e.target.value)}
                    aria-label="Tags"
                >
                    <option value="">Tags</option>
                    {options.tags?.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <select
                    value={filters.payment}
                    onChange={e => handleChange('payment', e.target.value)}
                    aria-label="Payment Method"
                >
                    <option value="">Payment Method</option>
                    {options.payment?.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                {/* Date Range Inputs */}
                {/* Date Filter Section (Vertical Stack) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                    <select
                        value={dateMode}
                        onChange={e => {
                            const mode = e.target.value;
                            setDateMode(mode);
                            if (mode === 'all') {
                                setFilters(prev => ({ ...prev, date_from: '', date_to: '', specific_date: '' }));
                            } else if (mode === 'specific') {
                                setFilters(prev => ({ ...prev, date_from: '', date_to: '', specific_date: '' }));
                            } else {
                                setFilters(prev => ({ ...prev, specific_date: '' }));
                            }
                        }}
                        style={{ fontWeight: 500, width: '100%' }}
                    >
                        <option value="all">Any Date</option>
                        <option value="specific">Specific Date</option>
                        <option value="range">Date Range</option>
                    </select>

                    {/* Conditional Inputs */}
                    {dateMode === 'specific' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            <span>Date:</span>
                            <input
                                type="date"
                                value={filters.specific_date || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFilters(prev => ({
                                        ...prev,
                                        specific_date: val,
                                        date_from: val,
                                        date_to: val
                                    }));
                                }}
                                aria-label="Select Date"
                                style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                    )}

                    {dateMode === 'range' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            <span>From:</span>
                            <input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={e => handleChange('date_from', e.target.value)}
                                aria-label="Start Date"
                                style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <span>To:</span>
                            <input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={e => handleChange('date_to', e.target.value)}
                                aria-label="End Date"
                                style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Center: Search (Optional if space permits, otherwise move right) */}
            {/* Keeping it simple as per screenshot which has filters filling left */}

            {/* Right: Sort & Search */}
            <div className="filter-group-right">
                <input
                    type="text"
                    placeholder="Search..."
                    value={filters.q}
                    onChange={e => handleChange('q', e.target.value)}
                    className="search-input"
                    aria-label="Search"
                />

                <select
                    value={`${filters.sort_by}-${filters.sort_dir}`}
                    onChange={e => {
                        const [by, dir] = e.target.value.split('-');
                        const newFilters = { ...filters, sort_by: by, sort_dir: dir };
                        setFilters(newFilters);
                        // Auto-apply for sort
                        const payload = { ...newFilters };
                        if (payload.age_range) delete payload.age_range; // Cleanup like handleApply
                        if (payload.tags) payload.tags = [payload.tags];
                        else payload.tags = [];
                        onApply(payload);
                    }}
                    aria-label="Sort By"
                    className="sort-select"
                >
                    <option value="date-desc">Sort by: Date (Newest)</option>
                    <option value="date-asc">Sort by: Date (Oldest)</option>
                    <option value="customer_name-asc">Sort by: Customer Name (A-Z)</option>
                    <option value="customer_name-desc">Sort by: Customer Name (Z-A)</option>
                    <option value="total_amount-desc">Sort by: Amount (High-Low)</option>
                    <option value="total_amount-asc">Sort by: Amount (Low-High)</option>
                    <option value="quantity-desc">Sort by: Quantity (High-Low)</option>
                    <option value="quantity-asc">Sort by: Quantity (Low-High)</option>
                </select>

                <button className="btn-primary" onClick={handleApply}>Apply</button>
            </div>
        </div>
    );
}
