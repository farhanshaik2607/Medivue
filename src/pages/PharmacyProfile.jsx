import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Phone, Truck, Navigation, ExternalLink, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPharmacyProfile, getPharmacyInventory } from '../services/firestoreService';
import './PharmacyProfile.css';

export default function PharmacyProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useApp();
    const [pharmacy, setPharmacy] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchPharmacy() {
            setLoading(true);
            try {
                const profile = await getPharmacyProfile(id);
                if (!cancelled && profile) {
                    setPharmacy(profile);
                    const inv = await getPharmacyInventory(id);
                    if (!cancelled) setInventory(inv.filter(item => item.qty > 0));
                }
            } catch (e) {
                console.error('Error fetching pharmacy profile:', e);
            }
            if (!cancelled) setLoading(false);
        }
        fetchPharmacy();
        return () => { cancelled = true; };
    }, [id]);

    if (loading) return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <Loader size={32} className="spin" style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                <p style={{ color: 'var(--gray-500)' }}>Loading pharmacy...</p>
            </div>
        </div>
    );

    if (!pharmacy) return <div className="page"><div className="empty-state"><h3>Pharmacy not found</h3></div></div>;

    return (
        <div className="page-plain pharmacy-page">
            <div className="pp-header">
                <button className="md-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <h1 className="pp-title">Pharmacy</h1>
            </div>

            <div className="pp-hero">
                <div className="pp-icon">🏥</div>
                <h2 className="pp-name">{pharmacy.name}</h2>
                <p className="pp-address"><MapPin size={13} /> {pharmacy.address}</p>
                <div className="pp-meta-row">
                    <span className={`ph-status ${pharmacy.isOpen !== false ? 'open' : 'closed'}`}>{pharmacy.isOpen !== false ? 'Open Now' : 'Closed'}</span>
                    <span className="pp-hours"><Clock size={12} /> {pharmacy.openTime || '09:00'} - {pharmacy.closeTime || '21:00'}</span>
                </div>
                <div className="pp-rating-row">
                    <div className="md-rating"><Star size={14} className="star filled" /> {pharmacy.rating || 0}</div>
                    <span className="text-xs" style={{ color: 'var(--gray-500)' }}>{pharmacy.reviews || 0} reviews</span>
                </div>
            </div>

            <div className="pp-actions">
                {pharmacy.phone && <button className="btn btn-outline" onClick={() => window.open(`tel:${pharmacy.phone}`)}><Phone size={14} /> Call</button>}
                <button className="btn btn-outline" onClick={() => {
                    if (pharmacy.lat && pharmacy.lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`, '_blank');
                }}><Navigation size={14} /> Directions</button>
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
                <h2>Available Medicines ({inventory.length})</h2>
            </div>
            <div className="pp-medicines">
                {inventory.length > 0 ? inventory.map(item => (
                    <div key={item.id} className="pp-med-row">
                        <div className="pp-med-info">
                            <span className="pp-med-emoji">💊</span>
                            <div>
                                <h4 className="pp-med-name">{item.name}</h4>
                                <p className="pp-med-salt">{item.description || item.salt || ''}</p>
                                <p className="pp-med-pack">{item.category || ''}</p>
                            </div>
                        </div>
                        <div className="pp-med-action">
                            <span className="price">₹{item.price}</span>
                            <span className="text-xs" style={{ color: 'var(--gray-500)' }}>Qty: {item.qty}</span>
                            <button className="btn btn-sm btn-primary" onClick={() => addToCart(item.id, pharmacy.id, item.name, item.price)}>Add</button>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm" style={{ padding: '16px', color: 'var(--gray-400)' }}>No medicines in stock</p>
                )}
            </div>

            <div className="divider" />

            <div className="section-header">
                <h2>Reviews</h2>
            </div>
            <div className="pp-reviews">
                <p className="text-sm" style={{ padding: '0 16px', color: 'var(--gray-400)' }}>No reviews yet</p>
            </div>
        </div>
    );
}
