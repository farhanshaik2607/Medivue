import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Trophy, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { medicines } from '../data/medicines';
import { pharmacies } from '../data/pharmacies';
import './BrandComparison.css';

export default function BrandComparison() {
    const { salt } = useParams();
    const navigate = useNavigate();
    const { state, addToCart } = useApp();
    const decodedSalt = decodeURIComponent(salt);

    const brands = medicines.filter(m => m.salt === decodedSalt);

    const getBestPrice = (medId) => {
        const available = pharmacies.filter(p => p.stock[medId]?.inStock && p.distance <= state.radius);
        if (available.length === 0) return null;
        const cheapest = available.sort((a, b) => a.stock[medId].price - b.stock[medId].price)[0];
        return { price: cheapest.stock[medId].price, pharmacy: cheapest };
    };

    const brandsWithPrices = brands.map(med => {
        const best = getBestPrice(med.id);
        return { ...med, bestPrice: best?.price || med.mrp, bestPharmacy: best?.pharmacy || null, available: !!best };
    }).sort((a, b) => a.bestPrice - b.bestPrice);

    const cheapestId = brandsWithPrices[0]?.id;
    const closestBrand = brandsWithPrices.filter(b => b.bestPharmacy).sort((a, b) => a.bestPharmacy.distance - b.bestPharmacy.distance)[0];

    return (
        <div className="page-plain brand-comp-page">
            <div className="bc-header">
                <button className="md-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <div>
                    <h1 className="bc-title">Brand Comparison</h1>
                    <p className="bc-salt">{decodedSalt}</p>
                </div>
            </div>

            <div className="bc-legend">
                <span className="bc-legend-item"><Trophy size={12} color="#F59E0B" /> Cheapest</span>
                <span className="bc-legend-item"><Zap size={12} color="#3B82F6" /> Closest</span>
            </div>

            <div className="bc-list">
                {brandsWithPrices.map(brand => (
                    <div key={brand.id} className={`bc-card card ${brand.id === cheapestId ? 'bc-cheapest' : ''}`} onClick={() => navigate(`/medicine/${brand.id}`)}>
                        <div className="bc-card-header">
                            <div className="bc-card-left">
                                <span className="bc-card-img">{brand.image}</span>
                                <div>
                                    <h3 className="bc-card-name">
                                        {brand.name}
                                        {brand.id === cheapestId && <span className="bc-tag cheapest"><Trophy size={10} /> Cheapest</span>}
                                        {closestBrand && brand.id === closestBrand.id && <span className="bc-tag closest"><Zap size={10} /> Closest</span>}
                                    </h3>
                                    <p className="bc-card-mfr">{brand.manufacturer}</p>
                                    <p className="bc-card-pack">{brand.packSize}</p>
                                </div>
                            </div>
                            <div className="bc-card-price-col">
                                <span className="price" style={{ fontSize: '18px' }}>₹{brand.bestPrice}</span>
                                {brand.bestPrice < brand.mrp && <span className="price-original">₹{brand.mrp}</span>}
                                <span className="price-discount">{Math.round((1 - brand.bestPrice / brand.mrp) * 100)}% off</span>
                            </div>
                        </div>
                        {brand.bestPharmacy && (
                            <div className="bc-card-footer">
                                <span className="bc-card-pharmacy">
                                    <MapPin size={12} /> {brand.bestPharmacy.name} · {brand.bestPharmacy.distance} km
                                    {brand.bestPharmacy.isOpen ? <span className="text-xs" style={{ color: 'var(--success)' }}> · Open</span> : <span className="text-xs" style={{ color: 'var(--danger)' }}> · Closed</span>}
                                </span>
                                <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); addToCart(brand.id, brand.bestPharmacy.id, brand.name, brand.bestPrice); }}>
                                    Add to Cart
                                </button>
                            </div>
                        )}
                        {!brand.available && (
                            <div className="bc-card-footer bc-unavailable">
                                <span>Not available within {state.radius} km</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
