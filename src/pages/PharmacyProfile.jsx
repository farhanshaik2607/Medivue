import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Phone, Truck, Navigation, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pharmacies, pharmacyReviews } from '../data/pharmacies';
import { medicines } from '../data/medicines';
import './PharmacyProfile.css';

export default function PharmacyProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useApp();
    const pharmacy = pharmacies.find(p => p.id === parseInt(id));

    if (!pharmacy) return <div className="page"><div className="empty-state"><h3>Pharmacy not found</h3></div></div>;

    const reviews = pharmacyReviews.filter(r => r.pharmacyId === pharmacy.id);
    const stockMeds = Object.entries(pharmacy.stock).filter(([, s]) => s.inStock).map(([medId, s]) => {
        const med = medicines.find(m => m.id === parseInt(medId));
        return med ? { ...med, storePrice: s.price, storeQty: s.qty } : null;
    }).filter(Boolean);

    return (
        <div className="page-plain pharmacy-page">
            <div className="pp-header">
                <button className="md-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <h1 className="pp-title">Pharmacy</h1>
            </div>

            <div className="pp-hero">
                <div className="pp-icon">{pharmacy.image}</div>
                <h2 className="pp-name">{pharmacy.name}</h2>
                <p className="pp-address"><MapPin size={13} /> {pharmacy.address}</p>
                <div className="pp-meta-row">
                    <span className={`ph-status ${pharmacy.isOpen ? 'open' : 'closed'}`}>{pharmacy.isOpen ? 'Open Now' : 'Closed'}</span>
                    <span className="pp-hours"><Clock size={12} /> {pharmacy.openTime} - {pharmacy.closeTime}</span>
                    <span className="pp-dist">{pharmacy.distance} km away</span>
                </div>
                <div className="pp-rating-row">
                    <div className="md-rating"><Star size={14} className="star filled" /> {pharmacy.rating}</div>
                    <span className="text-xs" style={{ color: 'var(--gray-500)' }}>{pharmacy.reviews} reviews</span>
                </div>
            </div>

            <div className="pp-actions">
                <button className="btn btn-outline"><Phone size={14} /> Call</button>
                <button className="btn btn-outline"><Navigation size={14} /> Directions</button>
                {pharmacy.deliveryAvailable && (
                    <div className="pp-delivery-info">
                        <Truck size={14} />
                        <span>Delivery: ₹{pharmacy.deliveryFee === 0 ? 'FREE' : pharmacy.deliveryFee}</span>
                        {pharmacy.freeDeliveryAbove > 0 && <span className="text-xs">(Free above ₹{pharmacy.freeDeliveryAbove})</span>}
                    </div>
                )}
            </div>

            <div className="divider" />

            <div className="section-header">
                <h2>Available Medicines ({stockMeds.length})</h2>
            </div>
            <div className="pp-medicines">
                {stockMeds.map(med => (
                    <div key={med.id} className="pp-med-row">
                        <div className="pp-med-info" onClick={() => navigate(`/medicine/${med.id}`)}>
                            <span className="pp-med-emoji">{med.image}</span>
                            <div>
                                <h4 className="pp-med-name">{med.name}</h4>
                                <p className="pp-med-salt">{med.salt}</p>
                                <p className="pp-med-pack">{med.packSize}</p>
                            </div>
                        </div>
                        <div className="pp-med-action">
                            <span className="price">₹{med.storePrice}</span>
                            {med.storePrice < med.mrp && <span className="price-original">₹{med.mrp}</span>}
                            <button className="btn btn-sm btn-primary" onClick={() => addToCart(med.id, pharmacy.id, med.name, med.storePrice)}>Add</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="divider" />

            <div className="section-header">
                <h2>Reviews</h2>
            </div>
            <div className="pp-reviews">
                {reviews.length > 0 ? reviews.map(r => (
                    <div key={r.id} className="pp-review card card-body">
                        <div className="pp-review-top">
                            <span className="pp-reviewer">{r.user}</span>
                            <div className="md-rating" style={{ fontSize: '12px' }}><Star size={12} className="star filled" /> {r.rating}</div>
                        </div>
                        <p className="pp-review-text">{r.comment}</p>
                        <span className="text-xs">{r.date}</span>
                    </div>
                )) : (
                    <p className="text-sm" style={{ padding: '0 16px', color: 'var(--gray-400)' }}>No reviews yet</p>
                )}
            </div>
        </div>
    );
}
