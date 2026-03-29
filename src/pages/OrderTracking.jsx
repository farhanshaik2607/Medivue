import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle2, Clock, Truck, ShoppingBag, MapPin, Phone, XCircle, Loader, Store, CircleDot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribeToOrder } from '../services/firestoreService';
import './OrderTracking.css';

const STATUS_STEPS = [
    { key: 'pending', label: 'Order Placed', icon: <ShoppingBag size={16} />, description: 'Your order has been placed successfully' },
    { key: 'accepted', label: 'Confirmed', icon: <Store size={16} />, description: 'Pharmacy has confirmed your order' },
    { key: 'ready', label: 'Ready', icon: <Package size={16} />, description: 'Your order is packed and ready' },
    { key: 'completed', label: 'Delivered', icon: <CheckCircle2 size={16} />, description: 'Order has been delivered / picked up' },
];

function getStepIndex(status) {
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
}

export default function OrderTracking() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { state } = useApp();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;
        const unsub = subscribeToOrder(orderId, (data) => {
            setOrder(data);
            setLoading(false);
        });
        return () => unsub();
    }, [orderId]);

    if (loading) {
        return (
            <div className="page-plain ot-page">
                <div className="ot-loading">
                    <Loader size={32} className="spin" style={{ color: 'var(--primary)' }} />
                    <p>Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="page-plain ot-page">
                <div className="ot-header">
                    <button className="ot-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                    <h1 className="ot-title">Order Not Found</h1>
                </div>
                <div className="ot-loading">
                    <XCircle size={48} style={{ color: 'var(--danger)' }} />
                    <h3>Order not found</h3>
                    <p>This order may have been removed or doesn't exist.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/orders')} style={{ marginTop: '16px' }}>Go to Orders</button>
                </div>
            </div>
        );
    }

    const currentStepIdx = getStepIndex(order.status);
    const isRejected = order.status === 'rejected';
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();

    return (
        <div className="page-plain ot-page">
            {/* Header */}
            <div className="ot-header">
                <button className="ot-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <div className="ot-header-center">
                    <h1 className="ot-title">Order Status</h1>
                    <span className="ot-order-id">#{orderId.slice(-6).toUpperCase()}</span>
                </div>
                <div className="ot-header-right">
                    <span className={`ot-live-badge ${isRejected ? 'rejected' : ''}`}>
                        <CircleDot size={10} />
                        {isRejected ? 'Cancelled' : 'Live'}
                    </span>
                </div>
            </div>

            <div className="ot-content">
                {/* Status Hero */}
                <div className={`ot-status-hero ${isRejected ? 'rejected' : ''}`}>
                    <div className="ot-status-hero-icon">
                        {isRejected ? <XCircle size={48} /> : (
                            currentStepIdx >= STATUS_STEPS.length - 1 ? <CheckCircle2 size={48} /> : 
                            currentStepIdx === 0 ? <ShoppingBag size={48} /> :
                            currentStepIdx === 1 ? <Store size={48} /> :
                            currentStepIdx === 2 ? <Package size={48} /> :
                            <Clock size={48} />
                        )}
                    </div>
                    <h2 className="ot-status-hero-title">
                        {isRejected ? 'Order Cancelled' : STATUS_STEPS[currentStepIdx]?.label || 'Processing'}
                    </h2>
                    <p className="ot-status-hero-desc">
                        {isRejected ? 'This order was cancelled by the pharmacy.' : STATUS_STEPS[currentStepIdx]?.description || ''}
                    </p>
                </div>

                {/* Progress Bar */}
                {!isRejected && (
                    <div className="ot-progress-section">
                        <div className="ot-progress-bar">
                            <div className="ot-progress-fill" style={{ width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}></div>
                        </div>
                        <div className="ot-progress-labels">
                            {STATUS_STEPS.map((step, idx) => (
                                <div key={step.key} className={`ot-progress-label ${idx <= currentStepIdx ? 'active' : ''} ${idx === currentStepIdx ? 'current' : ''}`}>
                                    <div className="ot-progress-dot">
                                        {idx <= currentStepIdx ? <CheckCircle2 size={18} /> : <div className="ot-dot-empty" />}
                                    </div>
                                    <span>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="ot-timeline-card">
                    <h3 className="ot-section-title">Order Timeline</h3>
                    <div className="ot-timeline">
                        {STATUS_STEPS.map((step, idx) => {
                            const isDone = idx <= currentStepIdx && !isRejected;
                            const isCurrent = idx === currentStepIdx && !isRejected;
                            return (
                                <div key={step.key} className={`ot-tl-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                    <div className="ot-tl-dot-wrap">
                                        <div className="ot-tl-dot">
                                            {isDone ? <CheckCircle2 size={14} /> : <div className="ot-tl-dot-inner" />}
                                        </div>
                                        {idx < STATUS_STEPS.length - 1 && <div className={`ot-tl-line ${isDone ? 'done' : ''}`} />}
                                    </div>
                                    <div className="ot-tl-content">
                                        <span className="ot-tl-label">{step.label}</span>
                                        <span className="ot-tl-desc">{step.description}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {isRejected && (
                            <div className="ot-tl-step done rejected">
                                <div className="ot-tl-dot-wrap">
                                    <div className="ot-tl-dot rejected"><XCircle size={14} /></div>
                                </div>
                                <div className="ot-tl-content">
                                    <span className="ot-tl-label">Order Cancelled</span>
                                    <span className="ot-tl-desc">The pharmacy has cancelled this order.</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Details Card */}
                <div className="ot-details-card">
                    <h3 className="ot-section-title">Order Details</h3>

                    <div className="ot-detail-row">
                        <span className="ot-detail-label"><Store size={14} /> Pharmacy</span>
                        <span className="ot-detail-value">{order.pharmacyName || 'N/A'}</span>
                    </div>

                    <div className="ot-detail-row">
                        <span className="ot-detail-label"><Clock size={14} /> Ordered At</span>
                        <span className="ot-detail-value">
                            {createdAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className="ot-detail-row">
                        <span className="ot-detail-label">
                            {order.deliveryMode === 'delivery' ? <><Truck size={14} /> Delivery</> : <><ShoppingBag size={14} /> Pickup</>}
                        </span>
                        <span className="ot-detail-value">{order.deliveryMode === 'delivery' ? 'Home Delivery' : 'Self Pickup'}</span>
                    </div>

                    {order.deliveryAddress && (
                        <div className="ot-detail-row">
                            <span className="ot-detail-label"><MapPin size={14} /> Address</span>
                            <span className="ot-detail-value ot-address">
                                {order.deliveryAddress.address}{order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ''}{order.deliveryAddress.pin ? ` - ${order.deliveryAddress.pin}` : ''}
                            </span>
                        </div>
                    )}

                    <div className="ot-detail-row">
                        <span className="ot-detail-label">💰 Payment</span>
                        <span className="ot-detail-value">{order.paymentMethod?.toUpperCase() || 'N/A'}</span>
                    </div>
                </div>

                {/* Items Card */}
                <div className="ot-items-card">
                    <h3 className="ot-section-title">Items Ordered</h3>
                    <div className="ot-items-list">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="ot-item-row">
                                <div className="ot-item-info">
                                    <span className="ot-item-name">{item.name}</span>
                                    <span className="ot-item-qty">× {item.qty}</span>
                                </div>
                                <span className="ot-item-price">₹{item.price * item.qty}</span>
                            </div>
                        ))}
                    </div>
                    <div className="ot-total-row">
                        <span>Total</span>
                        <span className="ot-total-price">₹{order.total}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="ot-actions">
                    <button className="btn btn-secondary btn-block btn-lg" onClick={() => navigate('/orders')}>
                        <Package size={18} /> View All Orders
                    </button>
                </div>
            </div>
        </div>
    );
}
