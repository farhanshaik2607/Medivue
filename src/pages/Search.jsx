import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Mic, ArrowLeft, X, Clock, TrendingUp, Filter, MapPin, Star, ChevronDown, Loader, Database, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { medicines, categories, popularSearches } from '../data/medicines';
import { pharmacies } from '../data/pharmacies';
import { SEARCH_DEBOUNCE_MS } from '../services/config';
import './Search.css';

export default function SearchPage() {
    const { state, dispatch, getPharmaciesWithMedicine, searchMedicinesAction } = useApp();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [showResults, setShowResults] = useState(!!searchParams.get('q') || !!searchParams.get('category'));
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ sort: 'relevance', priceMax: 500, onlyAvailable: true, onlyOTC: false });
    const inputRef = useRef(null);
    const debounceTimerRef = useRef(null);
    const selectedCategory = searchParams.get('category');

    useEffect(() => {
        if (!showResults) inputRef.current?.focus();
    }, [showResults]);

    useEffect(() => {
        if (searchParams.get('q') || searchParams.get('category')) {
            if (searchParams.get('q')) {
                setQuery(searchParams.get('q'));
                searchMedicinesAction(searchParams.get('q'));
            }
            setShowResults(true);
        }
    }, [searchParams, searchMedicinesAction]);

    // Debounced API search for suggestions
    const debouncedSearch = useCallback((searchQuery) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (!searchQuery || searchQuery.trim().length < 2) {
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
            return;
        }
        debounceTimerRef.current = setTimeout(() => {
            searchMedicinesAction(searchQuery.trim());
        }, SEARCH_DEBOUNCE_MS);
    }, [searchMedicinesAction, dispatch]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    // Local quick suggestions (instant, no debounce) for typed queries
    const localSuggestions = query.length > 0
        ? medicines.filter(m =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            m.salt.toLowerCase().includes(query.toLowerCase()) ||
            m.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)
        : [];

    // API suggestions (from debounced search)
    const apiSuggestions = state.searchResults
        .filter(m => m.source === 'fda')
        .slice(0, 5);

    // Merge suggestions: local first, then API
    const allSuggestions = [...localSuggestions.map(m => ({ ...m, source: 'local' }))];
    const localNames = new Set(localSuggestions.map(m => m.name.toLowerCase()));
    apiSuggestions.forEach(m => {
        if (!localNames.has(m.name.toLowerCase())) {
            allSuggestions.push(m);
        }
    });

    // Results for the results view
    const getResults = () => {
        // Start with API search results if available
        let resultSet = state.searchResults.length > 0
            ? [...state.searchResults]
            : medicines.filter(m => {
                const matchesQuery = !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.salt.toLowerCase().includes(query.toLowerCase());
                return matchesQuery;
            }).map(m => ({ ...m, source: 'local' }));

        // Apply category filter
        if (selectedCategory) {
            // Find the full category name from the id (e.g. 'pain' -> 'Pain Relief')
            const catInfo = categories.find(c => c.id === selectedCategory);
            if (catInfo) {
                resultSet = resultSet.filter(m => m.category === catInfo.name);
            }
        }

        // Apply price filter
        resultSet = resultSet.filter(m => m.mrp <= filters.priceMax);

        // Apply OTC filter
        if (filters.onlyOTC) {
            resultSet = resultSet.filter(m => !m.prescriptionRequired);
        }

        // Sort
        resultSet.sort((a, b) => {
            if (filters.sort === 'price_low') return a.mrp - b.mrp;
            if (filters.sort === 'price_high') return b.mrp - a.mrp;
            if (filters.sort === 'rating') return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
            // Relevance: local results first, then by reviews
            if (a.source === 'local' && b.source !== 'local') return -1;
            if (a.source !== 'local' && b.source === 'local') return 1;
            return (b.reviews || 0) - (a.reviews || 0);
        });

        return resultSet;
    };

    const results = showResults ? getResults() : [];

    const handleSearch = (searchQuery) => {
        setQuery(searchQuery);
        setShowResults(true);
        dispatch({ type: 'ADD_SEARCH_HISTORY', payload: searchQuery });
        searchMedicinesAction(searchQuery);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && query.trim()) handleSearch(query.trim());
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setShowResults(false);
        debouncedSearch(val);
    };

    const checkNearby = (medId) => {
        return pharmacies.some(p => p.stock[medId]?.inStock && p.distance <= state.radius);
    };

    const getMedicineUrl = (med) => {
        // For local medicines, use numeric ID; for FDA medicines, use their fda ID
        return `/medicine/${med.id}`;
    };

    const getCategoryColor = (category) => {
        const colorMap = {
            'Pain Relief': '#EF4444',
            'Antibiotics': '#3B82F6',
            'Gastro': '#F59E0B',
            'Allergy': '#8B5CF6',
            'Diabetes': '#EC4899',
            'Vitamins': '#22C55E',
            'Heart & BP': '#EF4444',
            'Skin Care': '#06B6D4',
            'Thyroid': '#6366F1',
            'Personal Care': '#14B8A6',
            'General Medicine': '#6B7280',
        };
        return colorMap[category] || '#6B7280';
    };

    return (
        <div className="page search-page">
            {/* Search Header */}
            <div className="search-header">
                <button className="search-back" onClick={() => showResults ? (setShowResults(false), setQuery('')) : navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="search-input-wrap">
                    <SearchIcon size={16} className="search-input-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search any medicine, sunscreen, health product..."
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        id="search-input"
                    />
                    {query && <button className="search-clear" onClick={() => { setQuery(''); setShowResults(false); dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] }); }}><X size={16} /></button>}
                </div>
                <button className="search-voice-btn" aria-label="Voice search"><Mic size={20} /></button>
            </div>

            {/* Suggestions dropdown */}
            {!showResults && query.length > 0 && (allSuggestions.length > 0 || state.searchLoading) && (
                <div className="search-suggestions animate-fade-in">
                    {state.searchLoading && allSuggestions.length === 0 && (
                        <div className="suggestion-loading">
                            <Loader size={16} className="spin" />
                            <span>Searching medicines...</span>
                        </div>
                    )}
                    {allSuggestions.map(med => (
                        <div key={med.id} className="suggestion-item" onClick={() => navigate(getMedicineUrl(med))}>
                            <SearchIcon size={14} />
                            <div className="suggestion-text">
                                <span className="suggestion-name">{med.name}</span>
                                <span className="suggestion-salt">{med.salt}</span>
                            </div>
                            <div className="suggestion-badges">
                                <span className="suggestion-category-badge" style={{ background: getCategoryColor(med.category) + '20', color: getCategoryColor(med.category) }}>
                                    {med.category}
                                </span>
                                {med.source === 'local' && checkNearby(med.id) && <span className="badge badge-success" style={{ fontSize: '9px' }}>Near you</span>}
                                {med.source === 'fda' && <span className="badge badge-fda" style={{ fontSize: '9px', background: '#dbeafe', color: '#1e40af' }}>FDA</span>}
                            </div>
                        </div>
                    ))}
                    {state.searchLoading && allSuggestions.length > 0 && (
                        <div className="suggestion-loading">
                            <Loader size={14} className="spin" />
                            <span>Loading more results...</span>
                        </div>
                    )}
                </div>
            )}

            {/* No suggestions found */}
            {!showResults && query.length >= 2 && !state.searchLoading && allSuggestions.length === 0 && (
                <div className="search-suggestions animate-fade-in">
                    <div className="suggestion-empty">
                        <SearchIcon size={16} />
                        <span>No medicines found for "{query}". Press Enter to search online.</span>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!showResults && !query && (
                <div className="search-empty">
                    {/* Search History */}
                    {state.searchHistory.length > 0 && (
                        <div className="search-section">
                            <div className="search-section-header">
                                <h3><Clock size={14} /> Recent Searches</h3>
                                <button className="text-sm" style={{ color: 'var(--primary)' }} onClick={() => dispatch({ type: 'CLEAR_SEARCH_HISTORY' })}>Clear</button>
                            </div>
                            <div className="search-chips">
                                {state.searchHistory.map(s => (
                                    <button key={s} className="chip" onClick={() => handleSearch(s)}>{s}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending */}
                    <div className="search-section">
                        <div className="search-section-header">
                            <h3><TrendingUp size={14} /> Trending</h3>
                        </div>
                        <div className="search-chips">
                            {popularSearches.map(s => (
                                <button key={s} className="chip" onClick={() => handleSearch(s)}>🔥 {s}</button>
                            ))}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="search-section">
                        <div className="search-section-header">
                            <h3>Browse Categories</h3>
                        </div>
                        <div className="search-categories-grid">
                            {categories.map(cat => (
                                <div key={cat.id} className="search-cat-card" onClick={() => { navigate(`/search?category=${cat.id}`); setShowResults(true); }}>
                                    <div className="search-cat-img-wrap">
                                        <img src={cat.image} alt={cat.name} className="search-cat-img" />
                                    </div>
                                    <span className="search-cat-name">{cat.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {showResults && (
                <div className="search-results animate-fade-in desktop-layout" style={{ padding: '0', background: 'var(--white)' }}>
                    <div className="desktop-sidebar">
                        <div className="results-meta">
                            <span>
                                {state.searchLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Loader size={14} className="spin" /> Searching...
                                    </span>
                                ) : (
                                    `${results.length} medicines`
                                )}
                            </span>
                            <button className="filter-btn mobile-only" onClick={() => setFilterOpen(!filterOpen)}>
                                <Filter size={14} /> Filters <ChevronDown size={12} />
                            </button>
                            <span className="desktop-only" style={{ fontWeight: 600, color: 'var(--gray-800)' }}>Filters</span>
                        </div>

                        <div className={`filter-panel ${!filterOpen ? 'mobile-hidden' : ''}`} style={{ display: 'block' }}>
                            <div className="filter-group">
                                <label className="form-label">Sort by</label>
                                <div className="toggle-group" style={{ flexDirection: 'column' }}>
                                    {[['relevance', 'Popular'], ['price_low', 'Price ↑'], ['price_high', 'Price ↓'], ['rating', 'Rating']].map(([val, label]) => (
                                        <button key={val} className={`toggle-option ${filters.sort === val ? 'active' : ''}`}
                                            onClick={() => setFilters(f => ({ ...f, sort: val }))}>{label}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-group">
                                <label className="form-label">Max Price: ₹{filters.priceMax}</label>
                                <input type="range" min="10" max="500" value={filters.priceMax}
                                    onChange={e => setFilters(f => ({ ...f, priceMax: parseInt(e.target.value) }))}
                                    className="range-slider" />
                            </div>
                            <label className="filter-check">
                                <input type="checkbox" checked={filters.onlyOTC} onChange={e => setFilters(f => ({ ...f, onlyOTC: e.target.checked }))} />
                                <span>Only OTC</span>
                            </label>
                        </div>
                    </div>

                    <div className="desktop-main">
                        <div className="results-list">
                            {results.map(med => {
                                const nearby = med.source === 'local' ? checkNearby(med.id) : false;
                                const cheapestPharmacy = med.source === 'local'
                                    ? pharmacies
                                        .filter(p => p.stock[med.id]?.inStock && p.distance <= state.radius)
                                        .sort((a, b) => a.stock[med.id].price - b.stock[med.id].price)[0]
                                    : null;

                                return (
                                    <div key={med.id} className="result-card card" onClick={() => navigate(getMedicineUrl(med))}>
                                        <div className="result-img">{med.image}</div>
                                        <div className="result-info">
                                            <div className="result-top">
                                                <h4 className="result-name">{med.name}</h4>
                                                <div className="result-tags">
                                                    {med.prescriptionRequired && <span className="tag tag-rx">Rx</span>}
                                                    <span className="tag" style={{ background: getCategoryColor(med.category) + '15', color: getCategoryColor(med.category), fontSize: '10px' }}>
                                                        {med.category}
                                                    </span>
                                                    {med.source === 'fda' && (
                                                        <span className="tag" style={{ background: '#dbeafe', color: '#1e40af', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                            <Shield size={8} /> FDA
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="result-salt">{med.salt}</p>
                                            <p className="result-mfr">{med.manufacturer} · {med.packSize}</p>
                                            {/* Uses preview */}
                                            {med.uses && med.uses.length > 0 && (
                                                <p className="result-uses">
                                                    Used for: {med.uses.slice(0, 3).join(', ')}
                                                    {med.uses.length > 3 && ` +${med.uses.length - 3} more`}
                                                </p>
                                            )}
                                            <div className="result-bottom">
                                                <div className="result-price-area">
                                                    <span className="price">₹{cheapestPharmacy ? cheapestPharmacy.stock[med.id].price : med.mrp}</span>
                                                    {cheapestPharmacy && cheapestPharmacy.stock[med.id].price < med.mrp && (
                                                        <>
                                                            <span className="price-original">₹{med.mrp}</span>
                                                            <span className="price-discount">{Math.round((1 - cheapestPharmacy.stock[med.id].price / med.mrp) * 100)}% off</span>
                                                        </>
                                                    )}
                                                </div>
                                                {nearby && (
                                                    <span className="badge badge-success">
                                                        <MapPin size={10} /> Near you
                                                    </span>
                                                )}
                                            </div>
                                            <div className="result-rating">
                                                <Star size={12} className="star filled" /> {med.rating} ({(med.reviews || 0).toLocaleString()})
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {!state.searchLoading && results.length === 0 && (
                                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                    <SearchIcon size={48} />
                                    <h3>Medicine not found nearby.</h3>
                                    <p>Try a different search term, or request this medicine from nearby pharmacies.</p>
                                    <button className="btn btn-primary" style={{ marginTop: '16px' }}
                                        onClick={() => navigate(`/request-medicine?name=${encodeURIComponent(query)}`)}>
                                        📡 Request Medicine
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
