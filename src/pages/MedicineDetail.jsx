import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Shield, AlertTriangle, MapPin, Star, Clock, Truck, ShoppingBag, ChevronRight, Info, BadgeCheck, Zap, CheckCircle2, Loader, ExternalLink, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { medicines } from '../data/medicines';
import { createMedicineRequest } from '../services/firestoreService';
import PharmacyMap from '../components/Map/PharmacyMap';
import './MedicineDetail.css';

export default function MedicineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state, dispatch, addToCart, getPharmaciesWithMedicine, getNearbyPharmacies, fetchMedicineDetail, fetchNearbyPharmaciesAction } = useApp();
    const [tab, setTab] = useState('info');
    const [mode, setMode] = useState('delivery');
    const [isSignaling, setIsSignaling] = useState(false);
    const [isSignaled, setIsSignaled] = useState(false);
    const [med, setMed] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch medicine data (local or API)
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        // Check if this was passed via search results cache
        const cached = state.medicineCache[id];
        if (cached) {
            setMed(cached);
            setLoading(false);
            return;
        }

        // Check local
        const numId = parseInt(id);
        if (!isNaN(numId)) {
            const local = medicines.find(m => m.id === numId);
            if (local) {
                setMed({ ...local, source: 'local' });
                setLoading(false);
                return;
            }
        }

        // Check search results
        const fromSearch = state.searchResults.find(m => String(m.id) === String(id));
        if (fromSearch) {
            setMed(fromSearch);
            dispatch({ type: 'CACHE_MEDICINE', payload: fromSearch });
            setLoading(false);
            return;
        }

        // Fetch from API
        fetchMedicineDetail(id).then(result => {
            if (!cancelled) {
                setMed(result);
                setLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, [id, fetchMedicineDetail, state.medicineCache, state.searchResults, dispatch]);

    // Fetch nearby pharmacies when location is available
    useEffect(() => {
        if (state.location.lat && state.location.lng && state.nearbyRealPharmacies.length === 0) {
            fetchNearbyPharmaciesAction(state.location.lat, state.location.lng);
        }
    }, [state.location, state.nearbyRealPharmacies.length, fetchNearbyPharmaciesAction]);

    // Loading state
    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader size={32} className="spin" style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                    <p style={{ color: 'var(--gray-500)' }}>Loading medicine details...</p>
                </div>
            </div>
        );
    }

    if (!med) return (
        <div className="page">
            <div className="empty-state">
                <AlertCircle size={48} style={{ color: 'var(--warning)' }} />
                <h3>Medicine not found</h3>
                <p>We couldn't find details for this medicine. Try searching again.</p>
                <button className="btn btn-primary" onClick={() => navigate('/search')} style={{ marginTop: '16px' }}>Search Medicines</button>
            </div>
        </div>
    );

    const isSaved = typeof med.id === 'number' && state.user.savedMedicines.includes(med.id);

    // Get pharmacies with this medicine
    const allNearbyPharmacies = getNearbyPharmacies();
    const medicine = med;
    const nearbyPharmacies = med ? getPharmaciesWithMedicine(med.id, med.mrp, med.name) : [];
    const substitutes = med.source === 'local' && med.substitutes
        ? med.substitutes.map(sid => medicines.find(m => m.id === sid)).filter(Boolean)
        : [];
    const cheapest = nearbyPharmacies[0];

    const handleSignalStores = async () => {
        if (!state.user || !state.user.uid) {
            alert('Please login to signal stores');
            return;
        }
        
        setIsSignaling(true);
        try {
            await createMedicineRequest({
                userId: state.user.uid,
                userName: state.user.displayName || 'Customer',
                userPhone: state.user.phoneNumber || '',
                userLat: state.location.lat,
                userLng: state.location.lng,
                userAddress: state.location.address || '',
                medicineId: med.id,
                medicineName: med.name,
                quantity: 1, // Defaulting to 1 strip
                urgency: 'normal',
                prescriptionUrl: null,
                deliveryOption: state.deliveryMode || 'delivery',
            });
            setIsSignaled(true);
        } catch (error) {
            console.error('Failed to signal nearby stores:', error);
            alert('Failed to send signal. Please try again later.');
        } finally {
            setIsSignaling(false);
        }
    };

    const getCategoryColor = (category) => {
        const colorMap = {
            'Pain Relief': '#EF4444', 'Antibiotics': '#3B82F6', 'Gastro': '#F59E0B',
            'Allergy': '#8B5CF6', 'Diabetes': '#EC4899', 'Vitamins': '#22C55E',
            'Heart & BP': '#EF4444', 'Skin Care': '#06B6D4', 'Thyroid': '#6366F1',
            'Personal Care': '#14B8A6', 'General Medicine': '#6B7280',
        };
        return colorMap[category] || '#6B7280';
    };

    const tabs = [
        ['info', 'Details'],
        ['dosage', 'Dosage'],
        ['sideeffects', 'Side Effects'],
        ['uses', 'Uses'],
    ];
    // Add Warnings tab if data exists
    if (med.warnings || med.contraindications) {
        tabs.push(['warnings', 'Warnings']);
    }

    return (
        <div className="page-plain med-detail-page">
            {/* Header */}
            <div className="med-detail-header">
                <button className="md-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <div className="md-header-actions">
                    {typeof med.id === 'number' && (
                        <button className={`md-heart ${isSaved ? 'saved' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_SAVED_MED', payload: med.id })}>
                            <Heart size={20} fill={isSaved ? '#EF4444' : 'none'} color={isSaved ? '#EF4444' : 'currentColor'} />
                        </button>
                    )}
                    <button className="md-share"><Share2 size={20} /></button>
                </div>
            </div>

            <div className="desktop-layout" style={{ padding: '0', background: 'var(--white)' }}>
                {/* LEFT SIDE (Main Info) */}
                <div className="desktop-main">
                    {/* Hero */}
                    <div className="md-hero">
                        <div className="md-hero-img">{med.image}</div>
                        <div className="md-hero-info">
                            <div className="md-tags">
                                {med.prescriptionRequired ? <span className="tag tag-rx"><Shield size={10} /> Rx Required</span> : <span className="tag tag-otc"><BadgeCheck size={10} /> OTC</span>}
                                {med.form && <span className="tag" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>{med.form}</span>}
                                <span className="tag" style={{ background: getCategoryColor(med.category) + '15', color: getCategoryColor(med.category) }}>
                                    {med.category}
                                </span>
                                {med.source === 'fda' && (
                                    <span className="tag" style={{ background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Shield size={10} /> FDA Data
                                    </span>
                                )}
                            </div>
                            <h1 className="md-name">{med.name}</h1>
                            <p className="md-salt">{med.salt}</p>
                            <p className="md-mfr">{med.manufacturer} · {med.packSize}</p>
                            <div className="md-rating-row">
                                <div className="md-rating"><Star size={14} className="star filled" /> {med.rating}</div>
                                <span className="md-reviews">{(med.reviews || 0).toLocaleString()} ratings</span>
                            </div>
                        </div>
                    </div>

                    <div className="divider mobile-only" />

                    {/* Live Availability Map */}
                    <div className="divider mobile-only" />
                    <div className="md-map-section">
                        <div className="section-header" style={{ marginBottom: 'var(--sp-4)' }}>
                            <h2>Live Availability Map</h2>
                            <span className="text-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                {state.pharmaciesLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Loader size={12} className="spin" /> Finding pharmacies...
                                    </span>
                                ) : nearbyPharmacies.length > 0 ? `${nearbyPharmacies.length} stores in stock` : 'Out of stock nearby'}
                            </span>
                        </div>

                        <PharmacyMap pharmacies={allNearbyPharmacies} userLocation={state.location} medId={med.id} medicineMrp={med.mrp} medicineName={med.name} />

                        {!state.pharmaciesLoading && nearbyPharmacies.length === 0 && (
                            <div className="md-out-of-stock-action card card-body" style={{ marginTop: 'var(--sp-4)' }}>
                                <div className="md-oos-content">
                                    <AlertTriangle size={24} color="var(--warning)" className="mb-2" />
                                    <h3>Currently unavailable nearby</h3>
                                    <p className="text-sm text-gray" style={{ marginBottom: 'var(--sp-4)' }}>We can alert nearby pharmacies about your requirement so they can procure it.</p>

                                    {isSignaled ? (
                                        <div className="signal-success glass-panel animate-fade-in">
                                            <CheckCircle2 color="var(--success)" size={20} />
                                            <span>Signal broadcasted! Pharmacies will update their stock soon.</span>
                                        </div>
                                    ) : (
                                        <button
                                            className={`btn btn-primary btn-block btn-lg signal-btn ${isSignaling ? 'loading' : ''}`}
                                            onClick={handleSignalStores}
                                            disabled={isSignaling}
                                        >
                                            {isSignaling ? (
                                                <span className="loader-dots"></span>
                                            ) : (
                                                <><Zap size={18} /> Signal Nearby Stores</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="divider mobile-only" />

                    {/* All pharmacy prices */}
                    {nearbyPharmacies.length > 0 && (
                        <div className="md-pricing-section">
                            <div className="md-all-prices" style={{ marginTop: 0 }}>
                                <h4>Compare Prices at Nearby Pharmacies</h4>
                                {nearbyPharmacies.map(ph => (
                                    <div key={ph.id} className="md-price-row" onClick={() => {
                                        if (ph.googleMapsUri) {
                                            window.open(ph.googleMapsUri, '_blank');
                                        } else if (typeof ph.id === 'number') {
                                            navigate(`/pharmacy/${ph.id}`);
                                        }
                                    }}>
                                        <div className="md-pr-info">
                                            <span className="md-pr-name">
                                                {ph.name}
                                                {ph.source === 'google' && <ExternalLink size={10} style={{ marginLeft: '4px', opacity: 0.5 }} />}
                                            </span>
                                            <span className="md-pr-meta">
                                                <MapPin size={11} /> {ph.distance} km ·{' '}
                                                {ph.isOpen ? <span style={{ color: 'var(--success)' }}>Open</span> : <span style={{ color: 'var(--danger)' }}>Closed</span>}
                                                {ph.rating > 0 && <> · <Star size={10} className="star filled" /> {ph.rating}</>}
                                            </span>
                                        </div>
                                        <div className="md-pr-price">
                                            <span className="price">₹{ph.medPrice}</span>
                                            <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); addToCart(med.id, ph.id, med.name, ph.medPrice); }}>Add</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {med.source === 'local' && (
                                <button className="btn btn-secondary btn-block" style={{ marginTop: '12px' }} onClick={() => navigate(`/brand-comparison/${encodeURIComponent(med.salt)}`)}>
                                    Compare All Brands <ChevronRight size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="divider mobile-only" />

                    {/* Info Tabs */}
                    <div className="md-tabs-container">
                        <div className="md-tabs">
                            {tabs.map(([key, label]) => (
                                <button key={key} className={`md-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
                            ))}
                        </div>

                        <div className="md-tab-content">
                            {tab === 'info' && (
                                <div className="md-info-block">
                                    <Info size={16} className="md-info-icon" />
                                    <p>{med.description || 'No detailed description available. Consult a healthcare provider for more information.'}</p>
                                </div>
                            )}
                            {tab === 'dosage' && (
                                <div className="md-info-block">
                                    <Info size={16} className="md-info-icon" />
                                    <p>{med.dosage || 'Follow the dosage instructions provided by your doctor or as printed on the medication packaging.'}</p>
                                </div>
                            )}
                            {tab === 'sideeffects' && (
                                <div className="md-info-block">
                                    <AlertTriangle size={16} className="md-info-icon" style={{ color: 'var(--warning)' }} />
                                    {med.sideEffects && med.sideEffects.length > 0 ? (
                                        <ul className="md-list">{med.sideEffects.map((se, i) => <li key={i}>{se}</li>)}</ul>
                                    ) : (
                                        <p>No specific side effects documented. Consult your doctor.</p>
                                    )}
                                </div>
                            )}
                            {tab === 'uses' && (
                                <div className="md-info-block">
                                    <BadgeCheck size={16} className="md-info-icon" style={{ color: 'var(--success)' }} />
                                    {med.uses && med.uses.length > 0 ? (
                                        <div className="md-uses">{med.uses.map((u, i) => <span key={i} className="badge badge-primary">{u}</span>)}</div>
                                    ) : (
                                        <p>Consult your healthcare provider for usage information.</p>
                                    )}
                                </div>
                            )}
                            {tab === 'warnings' && (
                                <div className="md-info-block">
                                    <AlertCircle size={16} className="md-info-icon" style={{ color: 'var(--danger)' }} />
                                    <div>
                                        {med.warnings && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <h4 style={{ color: 'var(--danger)', marginBottom: '8px', fontSize: '14px' }}>⚠️ Warnings</h4>
                                                <p style={{ fontSize: '13px', lineHeight: '1.6' }}>{med.warnings}</p>
                                            </div>
                                        )}
                                        {med.contraindications && (
                                            <div>
                                                <h4 style={{ color: 'var(--danger)', marginBottom: '8px', fontSize: '14px' }}>🚫 Contraindications</h4>
                                                <p style={{ fontSize: '13px', lineHeight: '1.6' }}>{med.contraindications}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Substitutes */}
                    {substitutes.length > 0 && (
                        <>
                            <div className="divider" />
                            <div className="md-substitutes">
                                <div className="section-header">
                                    <h2>Cheaper Alternatives</h2>
                                    <span className="text-sm" style={{ color: 'var(--primary)' }}>Same Salt</span>
                                </div>
                                <div className="scroll-row">
                                    {substitutes.map(sub => {
                                        const subPharmacies = getPharmaciesWithMedicine(sub.id, sub.mrp);
                                        const subPh = subPharmacies.length > 0 ? subPharmacies[0] : null;
                                        return (
                                            <div key={sub.id} className="sub-card card" onClick={() => navigate(`/medicine/${sub.id}`)}>
                                                <div className="sub-img">{sub.image}</div>
                                                <div className="sub-body">
                                                    <h4 className="sub-name">{sub.name}</h4>
                                                    <p className="sub-mfr">{sub.manufacturer}</p>
                                                    <div className="sub-price">
                                                        <span className="price">₹{subPh ? subPh.medPrice : sub.mrp}</span>
                                                        <span className="med-card-pack">{sub.packSize}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT SIDE (Sidebar / Buy Box) */}
                <div className="desktop-sidebar md-sidebar">
                    <div className="md-pricing-section" style={{ paddingTop: 0 }}>
                        <div className="md-pricing-header desktop-hidden" style={{ paddingTop: 'var(--sp-4)' }}>
                            <h3>Best Price Near You</h3>
                            {nearbyPharmacies.length > 0 && <span className="badge badge-success">{nearbyPharmacies.length} stores</span>}
                        </div>
                        {cheapest ? (
                            <div className="md-best-price card">
                                <div className="md-bp-left">
                                    <span className="md-bp-pharmacy">{cheapest.name}</span>
                                    <span className="md-bp-distance"><MapPin size={12} /> {cheapest.distance} km · {cheapest.walkTime} min walk</span>
                                </div>
                                <div className="md-bp-right">
                                    <span className="price" style={{ fontSize: '20px' }}>₹{cheapest.medPrice}</span>
                                    {cheapest.medPrice < med.mrp && (
                                        <div>
                                            <span className="price-original">MRP ₹{med.mrp}</span>
                                            <span className="price-discount"> {Math.round((1 - cheapest.medPrice / med.mrp) * 100)}% off</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="md-no-stock card card-body">
                                <AlertTriangle size={18} color="var(--warning)" />
                                <span>Not available at nearby pharmacies within {state.radius} km</span>
                            </div>
                        )}

                        <div className="desktop-hidden" style={{ marginTop: 'var(--sp-4)' }}>
                            {nearbyPharmacies.length <= 1 && med.source === 'local' && (
                                <button className="btn btn-secondary btn-block" onClick={() => navigate(`/brand-comparison/${encodeURIComponent(med.salt)}`)}>
                                    Compare All Brands <ChevronRight size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Delivery/Pickup Toggle */}
                    <div className="md-mode-section">
                        <div className="toggle-group">
                            <button className={`toggle-option ${mode === 'delivery' ? 'active' : ''}`} onClick={() => setMode('delivery')}>
                                <Truck size={14} /> Deliver to me
                            </button>
                            <button className={`toggle-option ${mode === 'pickup' ? 'active' : ''}`} onClick={() => setMode('pickup')}>
                                <ShoppingBag size={14} /> I'll pick up
                            </button>
                        </div>
                    </div>

                    {/* Desktop Add to Cart */}
                    {cheapest && (
                        <div className="md-desktop-cta desktop-only card card-body">
                            <span className="price" style={{ fontSize: '28px' }}>₹{cheapest.medPrice}</span>
                            {cheapest.medPrice < med.mrp && <span className="text-sm" style={{ color: 'var(--success)', fontWeight: 600 }}>You save ₹{med.mrp - cheapest.medPrice}</span>}
                            <span className="text-xs" style={{ color: 'var(--gray-500)', marginBottom: 'var(--sp-4)', display: 'block' }}>Sold by {cheapest.name}</span>
                            <button className="btn btn-primary btn-block btn-lg" onClick={() => addToCart(med.id, cheapest.id, med.name, cheapest.medPrice)}>
                                <ShoppingBag size={18} /> Add to Cart
                            </button>
                            <div style={{ marginTop: 'var(--sp-3)', fontSize: '11px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                <Shield size={12} color="var(--success)" /> Genuine Product · Easy Returns
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Bottom CTA */}
            {cheapest && (
                <div className="md-bottom-cta mobile-only">
                    <div className="md-cta-price">
                        <span className="price" style={{ fontSize: '18px' }}>₹{cheapest.medPrice}</span>
                        <span className="text-xs">{cheapest.name}</span>
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={() => addToCart(med.id, cheapest.id, med.name, cheapest.medPrice)}>
                        Add to Cart
                    </button>
                </div>
            )}
        </div>
    );
}
