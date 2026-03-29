import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Star, Package, Truck, ShoppingBag, ChevronRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribeToUserOrders } from '../services/firestoreService';
import './OrderHistory.css';

export default function OrderHistory() {
    const { state } = useApp();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!state.user?.uid) return;
        const unsub = subscribeToUserOrders(state.user.uid, (data) => {
            setOrders(data);
        });
        return () => unsub();
    }, [state.user?.uid]);

    const statusConfig = {
        completed: { label: 'Delivered', color: 'var(--success)', icon: <Check size={12} /> },
        ready: { label: 'Ready/On the Way', color: 'var(--accent)', icon: <Truck size={12} /> },
        accepted: { label: 'Preparing', color: 'var(--info)', icon: <Package size={12} /> },
        pending: { label: 'Order Placed', color: 'var(--gray-500)', icon: <Package size={12} /> },
        rejected: { label: 'Cancelled', color: 'var(--danger)', icon: <Check size={12} /> },
    };

    return (
        <div className="page oh-page">
            <div className="oh-header">
                <h1 className="heading-md">My Orders</h1>
            </div>

            <div className="oh-list">
                {orders.length === 0 && (
                    <div className="empty-state" style={{ padding: '48px 16px' }}>
                        <Package size={48} />
                        <h3>No orders yet</h3>
                        <p>When you place an order, it will appear here.</p>
                    </div>
                )}
                {orders.map(order => {
                    const sc = statusConfig[order.status] || statusConfig.pending;
                    const dateObj = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                    return (
                        <div key={order.id} className="oh-card card">
                            <div className="oh-card-top">
                                <div>
                                    <span className="oh-order-id">Order #{order.id.slice(-6).toUpperCase()}</span>
                                    <span className="oh-date">{dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <span className="oh-status" style={{ color: sc.color, background: sc.color + '15' }}>
                                    {sc.icon} {sc.label}
                                </span>
                            </div>
                            <div className="oh-pharmacy">
                                <span>{order.pharmacyName}</span>
                                <span className="oh-type">{order.deliveryMode === 'delivery' ? <><Truck size={11} /> Delivery</> : <><ShoppingBag size={11} /> Pickup</>}</span>
                            </div>
                            <div className="oh-items">
                                {order.items?.map((item, idx) => (
                                    <span key={idx} className="oh-item">{item.name} × {item.qty}</span>
                                ))}
                            </div>
                            <div className="oh-card-bottom">
                                <span className="oh-total">₹{order.total} · {order.paymentMethod?.toUpperCase()}</span>
                                <div className="oh-card-actions">
                                    {order.status === 'completed' && !order.rated && (
                                        <button className="btn btn-sm btn-outline" onClick={(e) => e.stopPropagation()}>
                                            <Star size={12} /> Rate
                                        </button>
                                    )}
                                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); navigate('/search'); }}>
                                        <RotateCcw size={12} /> Reorder
                                    </button>
                                    {(order.status === 'pending' || order.status === 'ready' || order.status === 'accepted') && (
                                        <button className="btn btn-sm btn-accent" onClick={(e) => { e.stopPropagation(); navigate(`/order-tracking/${order.id}`); }}>
                                            Track <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
