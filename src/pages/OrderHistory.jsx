import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Star, Package, Truck, ShoppingBag, ChevronRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './OrderHistory.css';

export default function OrderHistory() {
    const { state } = useApp();
    const navigate = useNavigate();

    const statusConfig = {
        delivered: { label: 'Delivered', color: 'var(--success)', icon: <Check size={12} /> },
        on_the_way: { label: 'On the Way', color: 'var(--accent)', icon: <Truck size={12} /> },
        packed: { label: 'Packed', color: 'var(--info)', icon: <Package size={12} /> },
        placed: { label: 'Placed', color: 'var(--gray-500)', icon: <Package size={12} /> },
    };

    return (
        <div className="page oh-page">
            <div className="oh-header">
                <h1 className="heading-md">My Orders</h1>
            </div>

            <div className="oh-list">
                {state.orders.map(order => {
                    const sc = statusConfig[order.status] || statusConfig.placed;
                    return (
                        <div key={order.id} className="oh-card card" onClick={() => order.status === 'on_the_way' ? navigate('/order-tracking') : null}>
                            <div className="oh-card-top">
                                <div>
                                    <span className="oh-order-id">{order.id}</span>
                                    <span className="oh-date">{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <span className="oh-status" style={{ color: sc.color, background: sc.color + '15' }}>
                                    {sc.icon} {sc.label}
                                </span>
                            </div>
                            <div className="oh-pharmacy">
                                <span>{order.pharmacyName}</span>
                                <span className="oh-type">{order.type === 'delivery' ? <><Truck size={11} /> Delivery</> : <><ShoppingBag size={11} /> Pickup</>}</span>
                            </div>
                            <div className="oh-items">
                                {order.items.map(item => (
                                    <span key={item.medId} className="oh-item">{item.name} × {item.qty}</span>
                                ))}
                            </div>
                            <div className="oh-card-bottom">
                                <span className="oh-total">₹{order.total} · {order.payment}</span>
                                <div className="oh-card-actions">
                                    {order.status === 'delivered' && !order.rated && (
                                        <button className="btn btn-sm btn-outline" onClick={(e) => e.stopPropagation()}>
                                            <Star size={12} /> Rate
                                        </button>
                                    )}
                                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); }}>
                                        <RotateCcw size={12} /> Reorder
                                    </button>
                                    {order.status === 'on_the_way' && (
                                        <button className="btn btn-sm btn-accent" onClick={(e) => { e.stopPropagation(); navigate('/order-tracking'); }}>
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
