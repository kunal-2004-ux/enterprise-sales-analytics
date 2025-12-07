import React, { useEffect, useState, useRef } from 'react';
import { fetchFilters } from '../services/salesService';

export default function FiltersPanel({ onFiltersChanged }) {
    const debounceTimer = useRef(null);

    const [options, setOptions] = useState({
        region: [],
        gender: [],
        category: [],
        payment: [],
        tags: []
    });

    const [localFilters, setLocalFilters] = useState({
        q: '',
        region: '',
        gender: '',
        category: '',
        payment: '',
        tags: [],
        date_from: '',
        date_to: ''
    });

    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoadingOptions(true);
        fetchFilters()
            .then(res => {
                if (!mounted) return;
                setOptions({
                    region: res.region || [],
                    gender: res.gender || [],
                    category: res.category || [],
                    payment: res.payment || [],
                    tags: res.tags || []
                });
            })
            .catch(err => {
                console.error('Failed to load filters', err);
                // keep options empty on failure
            })
            .finally(() => {
                if (mounted) setLoadingOptions(false);
            });

        return () => {
            mounted = false;
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    const handleChange = (field, value) => {
        if (field === 'q') {
            // Debounce search input and use a snapshot of filters to avoid stale closure
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            const newData = { ...localFilters, q: value };
            setLocalFilters(newData);
            debounceTimer.current = setTimeout(() => {
                onFiltersChanged(newData);
            }, 300);
            return;
        }

        const newData = { ...localFilters, [field]: value };
        setLocalFilters(newData);
        onFiltersChanged(newData);
    };

    const handleTagToggle = (tag) => {
        const newTags = localFilters.tags.includes(tag)
            ? localFilters.tags.filter(t => t !== tag)
            : [...localFilters.tags, tag];
        handleChange('tags', newTags);
    };

    const handleClear = () => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
        const reset = { q: '', region: '', gender: '', category: '', payment: '', tags: [], date_from: '', date_to: '' };
        setLocalFilters(reset);
        onFiltersChanged(reset);
    };

    return (
        <div className="filters-panel">
            <div className="filter-group">
                <label>Search</label>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Name or Phone..."
                    value={localFilters.q}
                    onChange={e => handleChange('q', e.target.value)}
                />
            </div>

            <div className="filter-group">
                <label>Region</label>
                <select className="select-field" value={localFilters.region} onChange={e => handleChange('region', e.target.value)}>
                    <option value="">All Regions</option>
                    {options.region.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            <div className="filter-group">
                <label>Category</label>
                <select className="select-field" value={localFilters.category} onChange={e => handleChange('category', e.target.value)}>
                    <option value="">All Categories</option>
                    {options.category.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="filter-group">
                <label>Gender</label>
                <select className="select-field" value={localFilters.gender} onChange={e => handleChange('gender', e.target.value)}>
                    <option value="">All</option>
                    {options.gender.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            <div className="filter-group">
                <label>Payment Method</label>
                <select className="select-field" value={localFilters.payment} onChange={e => handleChange('payment', e.target.value)}>
                    <option value="">All</option>
                    {options.payment.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            <div className="filter-group">
                <label>Date Range</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="date"
                        className="input-field"
                        value={localFilters.date_from}
                        onChange={e => handleChange('date_from', e.target.value)}
                    />
                    <input
                        type="date"
                        className="input-field"
                        value={localFilters.date_to}
                        onChange={e => handleChange('date_to', e.target.value)}
                    />
                </div>
            </div>

            <div className="filter-group">
                <label>Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {loadingOptions ? (
                        <div style={{ color: '#6b7280' }}>Loading tags...</div>
                    ) : (
                        options.tags.map(tag => (
                            <span
                                key={tag}
                                onClick={() => handleTagToggle(tag)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTagToggle(tag); }}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    background: localFilters.tags.includes(tag) ? '#2563eb' : '#e5e7eb',
                                    color: localFilters.tags.includes(tag) ? 'white' : 'black'
                                }}
                            >
                                {tag}
                            </span>
                        ))
                    )}
                </div>
            </div>

            <button className="clear-btn" onClick={handleClear}>
                Clear Filters
            </button>
        </div>
    );
}
