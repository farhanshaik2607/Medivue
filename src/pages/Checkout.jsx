import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Smartphone, Banknote, Wallet, Check, ChevronRight, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Checkout.css';

export default function Checkout() {
    const { state, dispatch, getCartTotal, getCartCount } = useApp();
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [orderPlaced, setOrderPlaced] = useState(false);

    const cartTotal = getCartTotal();
    const cartCount = getCartCount();
    const deliveryFee = cartTotal >= 299 ? 0 : 30;
    const grandTotal = cartTotal + deliveryFee;

    const handlePlaceOrder = () => {
        setOrderPlaced(true);
        setTimeout(() => {
            dispatch({ type: 'CLEAR_CART' });
            navigate('/order-tracking');
        }, 2000);
    };

    if (orderPlaced) {
        return (
            <div className="page-plain checkout-page">
                <div className="order-success animate-scale-in">
                    <div className="os-icon">✅</div>
                    <h2 className="heading-lg">Order Placed!</h2>
                    <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Your order has been placed successfully. Redirecting to tracking...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-plain checkout-page">
            <div className="co-header">
                <button className="md-back desktop-hidden" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <h1 className="co-title">Checkout</h1>
            </div>

            <div className="desktop-layout" style={{ padding: '0', background: 'var(--white)' }}>
                {/* Main Content (Left on Desktop) */}
                <div className="desktop-main">
                    {/* Delivery Address */}
                    {state.deliveryMode === 'delivery' && (
                        <div className="co-section">
                            <div className="co-section-title"><MapPin size={16} /> Delivery Address</div>
                            <div className="co-address-card card card-body">
                                <div className="co-addr-top">
                                    <span className="co-addr-label">{state.selectedAddress.label}</span>
                                    <button className="btn btn-sm btn-outline">Change</button>
                                </div>
                                <p className="co-addr-text">{state.selectedAddress.address}, {state.selectedAddress.city} - {state.selectedAddress.pin}</p>
                            </div>
                            <div className="co-saved-addresses">
                                {state.user.addresses.map(addr => (
                                    <button key={addr.id} className={`co-addr-chip ${state.selectedAddress.id === addr.id ? 'active' : ''}`}
                                        onClick={() => dispatch({ type: 'SET_SELECTED_ADDRESS', payload: addr })}>
                                        {addr.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment */}
                    <div className="co-section">
                        <div className="co-section-title"><CreditCard size={16} /> Payment Method</div>
                        <div className="co-payment-options">
                            {[
                                { id: 'upi', icon: <Smartphone size={18} />, label: 'UPI', sub: 'Google Pay, PhonePe, Paytm' },
                                { id: 'card', icon: <CreditCard size={18} />, label: 'Credit/Debit Card', sub: 'Visa, Mastercard, Rupay' },
                                { id: 'cod', icon: <Banknote size={18} />, label: 'Cash on Delivery', sub: 'Pay when you receive' },
                                { id: 'wallet', icon: <Wallet size={18} />, label: 'Wallet', sub: 'Paytm, Amazon Pay' },
                            ].map(pm => (
                                <div key={pm.id} className={`co-payment-option ${paymentMethod === pm.id ? 'active' : ''}`} onClick={() => setPaymentMethod(pm.id)}>
                                    <div className="co-pm-icon">{pm.icon}</div>
                                    <div className="co-pm-info">
                                        <span className="co-pm-label">{pm.label}</span>
                                        <span className="co-pm-sub">{pm.sub}</span>
                                    </div>
                                    <div className={`co-radio ${paymentMethod === pm.id ? 'checked' : ''}`}>
                                        {paymentMethod === pm.id && <Check size={12} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right on Desktop) */}
                <div className="desktop-sidebar co-sidebar">
                    {/* Order Summary */}
                    <div className="co-section" style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)' }}>
                        <div className="co-section-title" style={{ padding: 0, marginBottom: 'var(--sp-3)' }}>Order Summary</div>
                        <div className="cart-summary" style={{ margin: 0, padding: 0, border: 'none' }}>
                            <div className="cart-summary-row"><span>Items ({cartCount})</span><span>₹{cartTotal}</span></div>
                            <div className="cart-summary-row"><span>Delivery Fee</span><span style={{ color: deliveryFee === 0 ? 'var(--success)' : 'inherit' }}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
                            <div className="cart-summary-row total"><span>Total</span><span>₹{grandTotal}</span></div>
                        </div>
                    </div>

                    {/* Secure badge */}
                    <div className="co-secure" style={{ marginTop: 'var(--sp-4)', background: 'var(--success-light)', border: '1px solid #BBF7D0', padding: 'var(--sp-3)', borderRadius: 'var(--radius-lg)' }}>
                        <Shield size={16} color="var(--success)" />
                        <span style={{ fontWeight: 500, color: 'var(--success-dark)' }}>100% Secure Payments</span>
                    </div>

                    {/* Desktop Place Order */}
                    <div className="desktop-only card card-body" style={{ marginTop: 'var(--sp-4)', border: '1px solid var(--gray-200)' }}>
                        <button className="btn btn-primary btn-block btn-lg" onClick={handlePlaceOrder}>
                            Pay ₹{grandTotal}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom CTA */}
            <div className="co-bottom-cta mobile-only">
                <div className="cart-cta-left">
                    <span className="price" style={{ fontSize: '18px' }}>₹{grandTotal}</span>
                    <span className="text-xs">Total Amount</span>
                </div>
                <button className="btn btn-primary btn-lg" onClick={handlePlaceOrder}>
                    Place Order
                </button>
            </div>
        </div>
    );
}
