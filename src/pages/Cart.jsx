import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, Upload, Tag, Truck, ShoppingBag, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pharmacies } from '../data/pharmacies';
import './Cart.css';

export default function Cart() {
    const { state, dispatch, updateCartQty, removeFromCart, getCartTotal, getCartCount } = useApp();
    const navigate = useNavigate();
    const cartCount = getCartCount();
    const cartTotal = getCartTotal();

    // Group cart items by pharmacy
    const grouped = state.cart.reduce((acc, item) => {
        if (!acc[item.pharmacyId]) acc[item.pharmacyId] = [];
        acc[item.pharmacyId].push(item);
        return acc;
    }, {});

    if (cartCount === 0) {
        return (
            <div className="page-plain cart-page">
                <div className="cart-header">
                    <button className="md-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                    <h1 className="cart-title">Cart</h1>
                </div>
                <div className="empty-state">
                    <span style={{ fontSize: '48px', marginBottom: 'var(--sp-4)', display: 'block' }}>🛒</span>
                    <h3 className="heading-md" style={{ marginBottom: 'var(--sp-2)' }}>Your cart is empty</h3>
                    <p className="text-sm" style={{ marginBottom: 'var(--sp-6)', color: 'var(--gray-500)' }}>Browse medicines and add them to your cart</p>
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/search')}>Search Medicines</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-plain cart-page">
            <div className="cart-header">
                <button className="md-back desktop-hidden" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <h1 className="cart-title">Cart ({cartCount})</h1>
            </div>

            <div className="desktop-layout" style={{ padding: '0', background: 'var(--white)' }}>
                {/* Main Content (Left on Desktop) */}
                <div className="desktop-main cart-main">
                    {/* Delivery/Pickup toggle */}
                    <div style={{ padding: '12px 16px', background: 'var(--white)' }}>
                        <div className="toggle-group">
                            <button className={`toggle-option ${state.deliveryMode === 'delivery' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_DELIVERY_MODE', payload: 'delivery' })}>
                                <Truck size={14} /> Delivery
                            </button>
                            <button className={`toggle-option ${state.deliveryMode === 'pickup' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_DELIVERY_MODE', payload: 'pickup' })}>
                                <ShoppingBag size={14} /> Self Pickup
                            </button>
                        </div>
                    </div>

                    {/* Cart Items grouped by pharmacy */}
                    {Object.entries(grouped).map(([phId, items]) => {
                        const pharmacy = pharmacies.find(p => p.id === parseInt(phId));
                        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
                        return (
                            <div key={phId} className="cart-group">
                                <div className="cart-group-header">
                                    <span className="cart-group-name">{pharmacy?.image} {pharmacy?.name}</span>
                                    <span className="cart-group-dist">{pharmacy?.distance} km</span>
                                </div>
                                {items.map(item => (
                                    <div key={`${item.medId}-${item.pharmacyId}`} className="cart-item">
                                        <div className="cart-item-info">
                                            <h4 className="cart-item-name">{item.name}</h4>
                                            <span className="cart-item-price">₹{item.price} each</span>
                                        </div>
                                        <div className="cart-item-controls">
                                            <div className="qty-control">
                                                <button className="qty-btn" onClick={() => updateCartQty(item.medId, item.pharmacyId, item.qty - 1)}>
                                                    {item.qty === 1 ? <Trash2 size={14} color="var(--danger)" /> : <Minus size={14} />}
                                                </button>
                                                <span className="qty-value">{item.qty}</span>
                                                <button className="qty-btn" onClick={() => updateCartQty(item.medId, item.pharmacyId, item.qty + 1)}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <span className="cart-item-total">₹{item.price * item.qty}</span>
                                        </div>
                                    </div>
                                ))}
                                {pharmacy?.deliveryAvailable && state.deliveryMode === 'delivery' && (
                                    <div className="cart-delivery-note">
                                        <Truck size={12} />
                                        {subtotal >= pharmacy.freeDeliveryAbove ? 'Free delivery!' : `Delivery: ₹${pharmacy.deliveryFee} (Free above ₹${pharmacy.freeDeliveryAbove})`}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar (Right on Desktop) */}
                <div className="desktop-sidebar cart-sidebar">
                    {/* Prescription Upload */}
                    <div className="cart-rx-banner" onClick={() => navigate('/upload-prescription')}>
                        <Upload size={18} color="var(--info)" />
                        <div>
                            <span className="cart-rx-title">Have a prescription?</span>
                            <span className="cart-rx-sub">Upload it for faster processing</span>
                        </div>
                    </div>

                    {/* Coupon */}
                    <div className="cart-coupon">
                        <Tag size={16} color="var(--primary)" />
                        <input className="cart-coupon-input" placeholder="Enter coupon code" />
                        <button className="btn btn-sm btn-primary">Apply</button>
                    </div>

                    {/* Bill Summary */}
                    <div className="cart-summary">
                        <h3 className="cart-summary-title">Bill Summary</h3>
                        <div className="cart-summary-row">
                            <span>Item Total</span>
                            <span>₹{cartTotal}</span>
                        </div>
                        <div className="cart-summary-row">
                            <span>Delivery Fee</span>
                            <span style={{ color: 'var(--success)' }}>FREE</span>
                        </div>
                        <div className="cart-summary-row">
                            <span>Discount</span>
                            <span style={{ color: 'var(--success)' }}>-₹0</span>
                        </div>
                        <div className="cart-summary-row total">
                            <span>Total</span>
                            <span>₹{cartTotal}</span>
                        </div>
                    </div>

                    {/* Desktop Checkout CTA */}
                    <div className="desktop-only card card-body" style={{ marginTop: 'var(--sp-4)', border: '1px solid var(--gray-200)' }}>
                        <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/checkout')}>
                            Proceed to Checkout
                        </button>
                        <div style={{ marginTop: 'var(--sp-3)', fontSize: '11px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                            <Shield size={12} color="var(--success)" /> Safe & Secure Payments
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom CTA */}
            <div className="cart-bottom-cta mobile-only">
                <div className="cart-cta-left">
                    <span className="price" style={{ fontSize: '18px' }}>₹{cartTotal}</span>
                    <span className="text-xs">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/checkout')}>
                    Proceed to Checkout
                </button>
            </div>
        </div>
    );
}
