import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, User, TrendingUp, ClipboardList, CheckCircle, XCircle, Truck, ShoppingBag, MapPin, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribeToPharmacyOrders, updateOrderStatus } from '../services/firestoreService';
import './PharmacyRequests.css'; // Reusing standard pharmacy list styles

export default function PharmacyOrders() {
    const { state, handleLogout } = useApp();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('pending'); // pending | accepted | ready | completed
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (!state.user?.uid) return;
        const unsub = subscribeToPharmacyOrders(state.user.uid, (allOrders) => {
            setOrders(allOrders);
        });
        return () => unsub();
    }, [state.user?.uid]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        setProcessingId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Failed to update order status');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filter === 'pending') return o.status === 'pending';
        if (filter === 'accepted') return o.status === 'accepted';
        if (filter === 'ready') return o.status === 'ready' || o.status === 'completed';
        return true;
    });



    return (
        <div className="pr-page">
            <div className="pr-header">
                <button className="pd-icon-btn" onClick={() => navigate('/pharmacy-dashboard')}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="inv-title">Incoming Orders</h1>
            </div>

            <div className="pr-filters">
                {[['pending', '🛒 New Orders'], ['accepted', '👨‍🍳 Preparing'], ['ready', '✅ Ready/Completed']].map(([val, label]) => (
                    <button key={val} className={`chip ${filter === val ? 'active' : ''}`}
                        onClick={() => setFilter(val)}>{label}</button>
                ))}
            </div>

            <div className="pr-list">
                {filteredOrders.length === 0 && (
                    <div className="empty-state" style={{ padding: '48px 16px' }}>
                        <Package size={48} />
                        <h3>No orders found</h3>
                        <p>You have no {filter} orders right now.</p>
                    </div>
                )}

                {filteredOrders.map(order => {
                    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();

                    return (
                        <div key={order.id} className="pr-card">
                            <div className="pr-card-top">
                                <div className="pr-card-med">
                                    <span className="pr-card-icon">📦</span>
                                    <div>
                                        <h4 className="pr-card-name">Order from {order.userName}</h4>
                                        <span className="pr-card-qty">{order.items?.length || 0} items • ₹{order.total}</span>
                                    </div>
                                </div>
                                <div className="pr-card-meta">
                                    <span className={`pr-status-badge pr-status-${order.status}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="pr-card-details">
                                <span className="pr-detail"><Clock size={13} /> {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="pr-detail">{order.deliveryMode === 'delivery' ? <Truck size={13}/> : <ShoppingBag size={13}/>} {order.deliveryMode === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                                {order.paymentMethod && <span className="pr-detail">💰 {order.paymentMethod.toUpperCase()}</span>}
                            </div>

                            {/* Show Address if delivery */}
                            {order.deliveryMode === 'delivery' && order.deliveryAddress && (
                                <div className="pr-mine-msg" style={{ background: 'var(--gray-50)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)', marginTop: '8px' }}>
                                    <MapPin size={14} style={{ minWidth: '14px' }} />
                                    <span>{order.deliveryAddress.address}, {order.deliveryAddress.city} - {order.deliveryAddress.pin}</span>
                                </div>
                            )}

                            {/* Item List */}
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--gray-100)' }}>
                                <p className="text-xs" style={{ color: 'var(--gray-500)', marginBottom: '8px', fontWeight: 600 }}>ORDER ITEMS:</p>
                                {order.items?.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                                        <span>{item.qty}x {item.name}</span>
                                        <span>₹{item.price * item.qty}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions based on status */}
                            <div className="pr-card-actions" style={{ marginTop: '16px' }}>
                                {order.status === 'pending' && (
                                    <>
                                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                            disabled={processingId === order.id}>
                                            {processingId === order.id ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                                            Accept Order
                                        </button>
                                        <button className="btn btn-outline btn-sm" onClick={() => handleUpdateStatus(order.id, 'rejected')}
                                            disabled={processingId === order.id} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </>
                                )}

                                {order.status === 'accepted' && (
                                    <button className="btn btn-primary btn-sm btn-block" onClick={() => handleUpdateStatus(order.id, 'ready')}
                                        disabled={processingId === order.id}>
                                        {processingId === order.id ? <Loader2 size={14} className="spin" /> : <Package size={14} />}
                                        Mark as Ready
                                    </button>
                                )}

                                {order.status === 'ready' && (
                                    <button className="btn btn-primary btn-sm btn-block" onClick={() => handleUpdateStatus(order.id, 'completed')}
                                        disabled={processingId === order.id}>
                                        {processingId === order.id ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                                        Mark as Delivered/Picked Up
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <nav className="pd-bottom-nav">
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-dashboard')}>
                    <TrendingUp size={20} /><span>Dashboard</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-inventory')}>
                    <Package size={20} /><span>Inventory</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-requests')}>
                    <ClipboardList size={20} /><span>Requests</span>
                </button>
                <button className="pd-nav-item active" onClick={() => navigate('/pharmacy-orders')}>
                    <ShoppingBag size={20} /><span>Orders</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-owner-profile')}>
                    <User size={20} /><span>Profile</span>
                </button>
            </nav>
        </div>
    );
}
