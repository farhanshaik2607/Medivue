import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Clock, Check, MapPin, Navigation } from 'lucide-react';
import { activeOrder } from '../data/users';
import './OrderTracking.css';

export default function OrderTracking() {
    const navigate = useNavigate();
    const order = activeOrder;
    const [eta, setEta] = useState(order.eta);

    useEffect(() => {
        const timer = setInterval(() => {
            setEta(prev => Math.max(0, prev - 1));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="page-plain ot-page">
            <div className="ot-header">
                <button className="md-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <h1 className="ot-title">Live Tracking</h1>
                <span className="ot-order-id">{order.id}</span>
            </div>

            {/* Map placeholder */}
            <div className="ot-map">
                <div className="ot-map-placeholder">
                    <div className="ot-map-pin pharmacy">🏪</div>
                    <div className="ot-map-route"></div>
                    <div className="ot-map-pin driver">🚴</div>
                    <div className="ot-map-route"></div>
                    <div className="ot-map-pin destination">📍</div>
                </div>
                <div className="ot-eta-badge animate-pulse-badge">
                    <Clock size={14} />
                    <span>ETA: {eta} mins</span>
                </div>
            </div>

            {/* Driver Info */}
            <div className="ot-driver-card card">
                <div className="ot-driver-info">
                    <div className="ot-driver-avatar">🧑</div>
                    <div>
                        <h3 className="ot-driver-name">{order.driver.name}</h3>
                        <p className="ot-driver-vehicle">{order.driver.vehicle} · ⭐ {order.driver.rating}</p>
                    </div>
                </div>
                <div className="ot-driver-actions">
                    <button className="ot-action-btn call"><Phone size={16} /></button>
                    <button className="ot-action-btn chat"><MessageCircle size={16} /></button>
                </div>
            </div>

            {/* Status Timeline */}
            <div className="ot-timeline">
                <h3 className="ot-timeline-title">Order Status</h3>
                {order.timeline.map((step, idx) => (
                    <div key={step.status} className={`ot-step ${step.done ? 'done' : ''} ${idx === order.timeline.findIndex(s => !s.done) ? 'current' : ''}`}>
                        <div className="ot-step-dot">
                            {step.done ? <Check size={12} /> : <div className="ot-dot-empty" />}
                        </div>
                        {idx < order.timeline.length - 1 && <div className={`ot-step-line ${step.done ? 'done' : ''}`} />}
                        <div className="ot-step-info">
                            <span className="ot-step-label">{step.label}</span>
                            <span className="ot-step-time">{step.time || '--:--'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivery Proof Section */}
            <div className="ot-proof">
                <h3>Delivery Proof</h3>
                <p className="text-sm" style={{ color: 'var(--gray-400)' }}>Photo proof will appear here after delivery</p>
            </div>
        </div>
    );
}
