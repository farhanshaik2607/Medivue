import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Shield, AlertTriangle, MapPin, Star, Clock, Truck, ShoppingBag, ChevronRight, Info, BadgeCheck, Zap, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { medicines } from '../data/medicines';
import { pharmacies } from '../data/pharmacies';
import PharmacyMap from '../components/Map/PharmacyMap';
import './MedicineDetail.css';

export default function MedicineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state, dispatch, addToCart, getPharmaciesWithMedicine, getNearbyPharmacies } = useApp();
    const med = medicines.find(m => m.id === parseInt(id));
    const [tab, setTab] = useState('info');
    const [mode, setMode] = useState('delivery');
    const [isSignaling, setIsSignaling] = useState(false);
    const [isSignaled, setIsSignaled] = useState(false);

    if (!med) return <div className="page"><div className="empty-state"><h3>Medicine not found</h3></div></div>;

    const isSaved = state.user.savedMedicines.includes(med.id);
    const availablePharmacies = getPharmaciesWithMedicine(med.id);
    const nearbyPharmacies = getNearbyPharmacies();
    const substitutes = med.substitutes.map(sid => medicines.find(m => m.id === sid)).filter(Boolean);
    const cheapest = availablePharmacies[0];

    const handleSignalStores = () => {
        setIsSignaling(true);
        setTimeout(() => {
            setIsSignaling(false);
            setIsSignaled(true);
        }, 1500);
    };

    return (
        <div className="page-plain med-detail-page">
            {/* Header */}
            <div className="med-detail-header">
                <button className="md-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <div className="md-header-actions">
                    <button className={`md-heart ${isSaved ? 'saved' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_SAVED_MED', payload: med.id })}>
                        <Heart size={20} fill={isSaved ? '#EF4444' : 'none'} color={isSaved ? '#EF4444' : 'currentColor'} />
                    </button>
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
                            </div>
                            <h1 className="md-name">{med.name}</h1>
                            <p className="md-salt">{med.salt}</p>
                            <p className="md-mfr">{med.manufacturer} · {med.packSize}</p>
                            <div className="md-rating-row">
                                <div className="md-rating"><Star size={14} className="star filled" /> {med.rating}</div>
                                <span className="md-reviews">{med.reviews.toLocaleString()} ratings</span>
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
                                {availablePharmacies.length > 0 ? `${availablePharmacies.length} stores in stock` : 'Out of stock nearby'}
                            </span>
                        </div>

                        <PharmacyMap pharmacies={nearbyPharmacies} userLocation={state.location} medId={med.id} />

                        {availablePharmacies.length === 0 && (
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
                    {availablePharmacies.length > 1 && (
                        <div className="md-pricing-section">
                            <div className="md-all-prices" style={{ marginTop: 0 }}>
                                <h4>Compare Prices at Nearby Pharmacies</h4>
                                {availablePharmacies.map(ph => (
                                    <div key={ph.id} className="md-price-row" onClick={() => navigate(`/pharmacy/${ph.id}`)}>
                                        <div className="md-pr-info">
                                            <span className="md-pr-name">{ph.name}</span>
                                            <span className="md-pr-meta"><MapPin size={11} /> {ph.distance} km · {ph.isOpen ? <span style={{ color: 'var(--success)' }}>Open</span> : <span style={{ color: 'var(--danger)' }}>Closed</span>}</span>
                                        </div>
                                        <div className="md-pr-price">
                                            <span className="price">₹{ph.medPrice}</span>
                                            <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); addToCart(med.id, ph.id, med.name, ph.medPrice); }}>Add</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-secondary btn-block" style={{ marginTop: '12px' }} onClick={() => navigate(`/brand-comparison/${encodeURIComponent(med.salt)}`)}>
                                Compare All Brands <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

                    <div className="divider mobile-only" />

                    {/* Info Tabs */}
                    <div className="md-tabs-container">
                        <div className="md-tabs">
                            {[['info', 'Details'], ['dosage', 'Dosage'], ['sideeffects', 'Side Effects'], ['uses', 'Uses']].map(([key, label]) => (
                                <button key={key} className={`md-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
                            ))}
                        </div>

                        <div className="md-tab-content">
                            {tab === 'info' && <div className="md-info-block"><Info size={16} className="md-info-icon" /><p>{med.description}</p></div>}
                            {tab === 'dosage' && <div className="md-info-block"><Info size={16} className="md-info-icon" /><p>{med.dosage}</p></div>}
                            {tab === 'sideeffects' && (
                                <div className="md-info-block">
                                    <AlertTriangle size={16} className="md-info-icon" style={{ color: 'var(--warning)' }} />
                                    <ul className="md-list">{med.sideEffects.map(se => <li key={se}>{se}</li>)}</ul>
                                </div>
                            )}
                            {tab === 'uses' && (
                                <div className="md-info-block">
                                    <BadgeCheck size={16} className="md-info-icon" style={{ color: 'var(--success)' }} />
                                    <div className="md-uses">{med.uses.map(u => <span key={u} className="badge badge-primary">{u}</span>)}</div>
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
                                        const subPh = pharmacies.filter(p => p.stock[sub.id]?.inStock).sort((a, b) => a.stock[sub.id].price - b.stock[sub.id].price)[0];
                                        return (
                                            <div key={sub.id} className="sub-card card" onClick={() => navigate(`/medicine/${sub.id}`)}>
                                                <div className="sub-img">{sub.image}</div>
                                                <div className="sub-body">
                                                    <h4 className="sub-name">{sub.name}</h4>
                                                    <p className="sub-mfr">{sub.manufacturer}</p>
                                                    <div className="sub-price">
                                                        <span className="price">₹{subPh ? subPh.stock[sub.id].price : sub.mrp}</span>
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
                            {availablePharmacies.length > 0 && <span className="badge badge-success">{availablePharmacies.length} stores</span>}
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
                            {availablePharmacies.length <= 1 && (
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
