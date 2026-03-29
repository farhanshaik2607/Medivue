import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, Package, Truck, MapPin, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribeToUserRequests } from '../services/firestoreService';
import './MyRequests.css';

const getStatusSteps = (deliveryOption) => {
    const isDelivery = deliveryOption === 'delivery';
    return [
        { key: 'requested', label: 'Requested', icon: Clock },
        { key: 'accepted', label: 'Accepted', icon: CheckCircle },
        { key: 'preparing', label: 'Preparing', icon: Package },
        { key: 'ready', label: isDelivery ? 'Out for Delivery' : 'Ready for Pickup', icon: isDelivery ? Truck : Store },
        { key: 'completed', label: 'Completed', icon: CheckCircle },
    ];
};

function getStepIndex(status, steps) {
    const idx = steps.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
}

export default function MyRequests() {
    const { state } = useApp();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!state.user?.uid) return;
        const unsub = subscribeToUserRequests(state.user.uid, (reqs) => {
            setRequests(reqs);
            setLoading(false);
        });
        return () => unsub();
    }, [state.user?.uid]);

    return (
        <div className="mr-page page">
            <div className="mr-header">
                <button className="search-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="rm-title">My Requests</h1>
            </div>

            <div className="mr-content">
                {loading && (
                    <div className="pd-loading">
                        <div className="skeleton" style={{ width: '100%', height: '120px', marginBottom: '12px' }}></div>
                        <div className="skeleton" style={{ width: '100%', height: '120px' }}></div>
                    </div>
                )}

                {!loading && requests.length === 0 && (
                    <div className="empty-state" style={{ padding: '48px 16px' }}>
                        <Package size={48} />
                        <h3>No requests yet</h3>
                        <p>When you request a medicine, it will appear here.</p>
                        <button className="btn btn-primary" style={{ marginTop: '16px' }}
                            onClick={() => navigate('/search')}>Search Medicines</button>
                    </div>
                )}

                {requests.map(req => {
                    const steps = getStatusSteps(req.deliveryOption);
                    const currentStep = getStepIndex(req.status, steps);
                    const createdAt = req.createdAt?.toDate ? req.createdAt.toDate() : new Date();

                    return (
                        <div key={req.id} className="mr-card">
                            <div className="mr-card-top">
                                <div>
                                    <h3 className="mr-med-name">💊 {req.medicineName}</h3>
                                    <span className="mr-meta">Qty: {req.quantity} • {req.urgency === 'urgent' ? '🚨 Urgent' : '🕐 Normal'} • {req.deliveryOption === 'delivery' ? '🚴 Delivery' : '🏪 Pickup'}</span>
                                    <span className="mr-date">{createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            {/* Accepted Notification */}
                            {req.acceptedBy && req.acceptedPharmacyName && (
                                <div className="mr-accepted">
                                    <CheckCircle size={16} color="var(--primary)" />
                                    <div>
                                        <span className="mr-accepted-title">{req.acceptedPharmacyName} accepted your request.</span>
                                        {req.acceptedPharmacyDistance && (
                                            <span className="mr-accepted-detail"><MapPin size={12} /> {req.acceptedPharmacyDistance} km away</span>
                                        )}
                                        {req.estimatedPrice && (
                                            <span className="mr-accepted-detail">💰 ≈ ₹{req.estimatedPrice}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status Stepper */}
                            <div className="mr-stepper">
                                {steps.map((step, i) => {
                                    const StepIcon = step.icon;
                                    const isDone = i <= currentStep;
                                    const isCurrent = i === currentStep;
                                    return (
                                        <div key={step.key} className={`mr-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                            <div className="mr-step-line-before"></div>
                                            <div className="mr-step-dot">
                                                <StepIcon size={14} />
                                            </div>
                                            <span className="mr-step-label">{step.label}</span>
                                            <div className="mr-step-line-after"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
