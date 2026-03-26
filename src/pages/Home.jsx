import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, ChevronRight, Upload, Star, Clock, MapPin, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { medicines, categories, healthArticles, popularSearches } from '../data/medicines';
import { banners } from '../data/offers';
import './Home.css';

export default function Home() {
    const { getNearbyPharmacies, state } = useApp();
    const navigate = useNavigate();
    const [bannerIdx, setBannerIdx] = useState(0);
    const bannerRef = useRef(null);
    const nearbyPharmacies = getNearbyPharmacies();
    const trendingMeds = medicines.filter(m => m.reviews > 3000).slice(0, 8);

    useEffect(() => {
        const timer = setInterval(() => {
            setBannerIdx(prev => (prev + 1) % banners.length);
        }, 3500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="page home-page">
            {/* Search Bar */}
            <div className="home-search-wrap" onClick={() => navigate('/search')}>
                <div className="home-search" id="home-search-bar">
                    <Search size={18} className="home-search-icon" />
                    <span className="home-search-placeholder">Search medicines, salts, brands...</span>
                    <button className="home-search-mic" aria-label="Voice search">
                        <Mic size={18} />
                    </button>
                </div>
            </div>

            {/* Banner Carousel */}
            <div className="banner-carousel" ref={bannerRef}>
                <div className="banner-track" style={{ transform: `translateX(-${bannerIdx * 100}%)` }}>
                    {banners.map(banner => (
                        <div key={banner.id} className="banner-slide" style={{ background: banner.gradient }}>
                            <div className="banner-content">
                                <h3 className="banner-title">{banner.title}</h3>
                                <p className="banner-subtitle">{banner.subtitle}</p>
                                <button className="banner-cta" onClick={() => navigate(banner.path || '/search')}>{banner.cta} <ChevronRight size={14} /></button>
                            </div>
                            <div className="banner-graphic">
                                {banner.id === 1 && '🎉'}
                                {banner.id === 2 && '📋'}
                                {banner.id === 3 && '🩺'}
                                {banner.id === 4 && '🚴'}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="banner-dots">
                    {banners.map((_, i) => (
                        <button key={i} className={`banner-dot ${i === bannerIdx ? 'active' : ''}`} onClick={() => setBannerIdx(i)} />
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <div className="quick-action" onClick={() => navigate('/upload-prescription')}>
                    <div className="qa-icon" style={{ background: '#EFF6FF' }}><Upload size={20} color="#3B82F6" /></div>
                    <span>Upload Prescription</span>
                </div>
                <div className="quick-action" onClick={() => navigate('/orders')}>
                    <div className="qa-icon" style={{ background: '#ECFDF5' }}><Truck size={20} color="#22C55E" /></div>
                    <span>Track Order</span>
                </div>
                <div className="quick-action" onClick={() => navigate('/offers')}>
                    <div className="qa-icon" style={{ background: '#FFF7ED' }}>🏷️</div>
                    <span>Offers</span>
                </div>
                <div className="quick-action" onClick={() => navigate('/orders')}>
                    <div className="qa-icon" style={{ background: '#FDF2F8' }}><Clock size={20} color="#EC4899" /></div>
                    <span>Reorder</span>
                </div>
            </div>

            <div className="divider" />

            {/* Categories */}
            <div className="section-header">
                <h2>Browse by Category</h2>
            </div>
            <div className="scroll-row categories-row">
                {categories.map(cat => (
                    <div key={cat.id} className="category-card" onClick={() => navigate(`/search?category=${cat.id}`)}>
                        <div className="category-img-wrap">
                            <img src={cat.image} alt={cat.name} className="category-img" />
                        </div>
                        <span className="category-name">{cat.name}</span>
                    </div>
                ))}
            </div>

            <div className="divider" />

            {/* Nearby Pharmacies */}
            <div className="section-header">
                <h2>Pharmacies Near You</h2>
                <span className="see-all" onClick={() => navigate('/search?view=pharmacies')}>See All</span>
            </div>
            <div className="scroll-row">
                {nearbyPharmacies.slice(0, 6).map(ph => (
                    <div key={ph.id} className="pharmacy-card-sm card" onClick={() => navigate(`/pharmacy/${ph.id}`)}>
                        <div className="ph-card-header">
                            <span className="ph-icon">{ph.image}</span>
                            <span className={`ph-status ${ph.isOpen ? 'open' : 'closed'}`}>
                                {ph.isOpen ? 'Open' : 'Closed'}
                            </span>
                        </div>
                        <h4 className="ph-name">{ph.name}</h4>
                        <div className="ph-meta">
                            <span><MapPin size={12} /> {ph.distance} km</span>
                            <span><Star size={12} className="star filled" /> {ph.rating}</span>
                        </div>
                        <div className="ph-time">{ph.walkTime} min walk · {ph.driveTime} min drive</div>
                    </div>
                ))}
            </div>

            <div className="divider" />

            {/* Trending Medicines */}
            <div className="section-header">
                <h2>Trending Medicines</h2>
                <span className="see-all" onClick={() => navigate('/search?sort=popular')}>See All</span>
            </div>
            <div className="scroll-row">
                {trendingMeds.map(med => (
                    <div key={med.id} className="med-card-sm card" onClick={() => navigate(`/medicine/${med.id}`)}>
                        <div className="med-card-img">{med.image}</div>
                        <div className="med-card-body">
                            <h4 className="med-card-name">{med.name}</h4>
                            <p className="med-card-salt">{med.salt}</p>
                            <div className="med-card-price">
                                <span className="price">₹{med.mrp}</span>
                                <span className="med-card-pack">{med.packSize}</span>
                            </div>
                            {med.prescriptionRequired && <span className="tag tag-rx">Rx</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="divider" />

            {/* Popular Searches */}
            <div className="section-header">
                <h2>Popular Searches</h2>
            </div>
            <div className="popular-searches">
                {popularSearches.map(s => (
                    <button key={s} className="chip" onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}>
                        <Search size={12} /> {s}
                    </button>
                ))}
            </div>

            <div className="divider" />

            {/* Health Articles */}
            <div className="section-header">
                <h2>Health Tips</h2>
                <span className="see-all">View All</span>
            </div>
            <div className="scroll-row">
                {healthArticles.map(article => (
                    <div key={article.id} className="article-card card">
                        <div className="article-header" style={{ background: article.color + '15' }}>
                            <span className="article-cat" style={{ color: article.color }}>{article.category}</span>
                            <span className="article-time">{article.readTime} read</span>
                        </div>
                        <div className="card-body">
                            <h4 className="article-title">{article.title}</h4>
                            <p className="article-excerpt">{article.excerpt}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Spacer */}
            <div style={{ height: '16px' }} />
        </div>
    );
}
