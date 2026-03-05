import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Mic, ArrowLeft, X, Clock, TrendingUp, Filter, MapPin, Star, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { medicines, categories, popularSearches } from '../data/medicines';
import { pharmacies } from '../data/pharmacies';
import './Search.css';

export default function SearchPage() {
    const { state, dispatch, getPharmaciesWithMedicine } = useApp();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [showResults, setShowResults] = useState(!!searchParams.get('q'));
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ sort: 'relevance', priceMax: 500, onlyAvailable: true, onlyOTC: false });
    const inputRef = useRef(null);
    const selectedCategory = searchParams.get('category');

    useEffect(() => {
        if (!showResults) inputRef.current?.focus();
    }, [showResults]);

    useEffect(() => {
        if (searchParams.get('q')) {
            setQuery(searchParams.get('q'));
            setShowResults(true);
        }
    }, [searchParams]);

    const suggestions = query.length > 0
        ? medicines.filter(m =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            m.salt.toLowerCase().includes(query.toLowerCase()) ||
            m.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8)
        : [];

    const results = showResults
        ? medicines.filter(m => {
            const matchesQuery = !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.salt.toLowerCase().includes(query.toLowerCase());
            const matchesCat = !selectedCategory || m.category.toLowerCase().replace(/\s+&\s+/g, '').replace(/\s+/g, '').includes(selectedCategory.toLowerCase());
            const matchesPrice = m.mrp <= filters.priceMax;
            const matchesOTC = !filters.onlyOTC || !m.prescriptionRequired;
            return matchesQuery && matchesCat && matchesPrice && matchesOTC;
        }).sort((a, b) => {
            if (filters.sort === 'price_low') return a.mrp - b.mrp;
            if (filters.sort === 'price_high') return b.mrp - a.mrp;
            if (filters.sort === 'rating') return b.rating - a.rating;
            return b.reviews - a.reviews;
        })
        : [];

    const handleSearch = (searchQuery) => {
        setQuery(searchQuery);
        setShowResults(true);
        dispatch({ type: 'ADD_SEARCH_HISTORY', payload: searchQuery });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && query.trim()) handleSearch(query.trim());
    };

    const checkNearby = (medId) => {
        return pharmacies.some(p => p.stock[medId]?.inStock && p.distance <= state.radius);
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
                        placeholder="Search medicines, salts, brands..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setShowResults(false); }}
                        onKeyDown={handleKeyDown}
                        id="search-input"
                    />
                    {query && <button className="search-clear" onClick={() => { setQuery(''); setShowResults(false); }}><X size={16} /></button>}
                </div>
                <button className="search-voice-btn" aria-label="Voice search"><Mic size={20} /></button>
            </div>

            {/* Suggestions */}
            {!showResults && query.length > 0 && suggestions.length > 0 && (
                <div className="search-suggestions animate-fade-in">
                    {suggestions.map(med => (
                        <div key={med.id} className="suggestion-item" onClick={() => navigate(`/medicine/${med.id}`)}>
                            <SearchIcon size={14} />
                            <div className="suggestion-text">
                                <span className="suggestion-name">{med.name}</span>
                                <span className="suggestion-salt">{med.salt}</span>
                            </div>
                            {checkNearby(med.id) && <span className="badge badge-success" style={{ fontSize: '9px' }}>Near you</span>}
                        </div>
                    ))}
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
                                    <span className="search-cat-icon" style={{ background: cat.color + '15' }}>{cat.icon}</span>
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
                            <span>{results.length} medicines</span>
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
                                const nearby = checkNearby(med.id);
                                const cheapestPharmacy = pharmacies
                                    .filter(p => p.stock[med.id]?.inStock && p.distance <= state.radius)
                                    .sort((a, b) => a.stock[med.id].price - b.stock[med.id].price)[0];

                                return (
                                    <div key={med.id} className="result-card card" onClick={() => navigate(`/medicine/${med.id}`)}>
                                        <div className="result-img">{med.image}</div>
                                        <div className="result-info">
                                            <div className="result-top">
                                                <h4 className="result-name">{med.name}</h4>
                                                {med.prescriptionRequired && <span className="tag tag-rx">Rx</span>}
                                            </div>
                                            <p className="result-salt">{med.salt}</p>
                                            <p className="result-mfr">{med.manufacturer} · {med.packSize}</p>
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
                                                <Star size={12} className="star filled" /> {med.rating} ({med.reviews.toLocaleString()})
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {results.length === 0 && (
                                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                    <SearchIcon size={48} />
                                    <h3>No medicines found</h3>
                                    <p>Try a different search term or adjust filters</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
