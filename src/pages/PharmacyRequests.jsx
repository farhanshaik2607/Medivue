import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Package, TrendingUp, ClipboardList, User, ShoppingBag, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribeToPharmacyRequests, acceptMedicineRequest, rejectMedicineRequest, getPharmacyProfile, updateRequestStatus } from '../services/firestoreService';
import './PharmacyRequests.css';

export default function PharmacyRequests() {
    const { state, handleLogout } = useApp();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [pharmacy, setPharmacy] = useState(null);
    const [filter, setFilter] = useState('pending'); // pending | accepted | all
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (!state.user?.uid) return;

        const loadProfile = async () => {
            const p = await getPharmacyProfile(state.user.uid);
            setPharmacy(p);
        };
        loadProfile();

        const unsub = subscribeToPharmacyRequests((allRequests) => {
            setRequests(allRequests);
        });
        return () => unsub();
    }, [state.user?.uid]);

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        if (!lat1 || !lng1 || !lat2 || !lng2) return null;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const handleAccept = async (requestId) => {
        if (!pharmacy) return;
        setProcessingId(requestId);

        const req = requests.find(r => r.id === requestId);
        const dist = req ? calculateDistance(pharmacy.lat, pharmacy.lng, req.userLat, req.userLng) : null;

        const result = await acceptMedicineRequest(requestId, {
            pharmacyId: state.user.uid,
            pharmacyName: pharmacy.name,
            distance: dist ? parseFloat(dist.toFixed(1)) : null,
            estimatedPrice: null,
        });

        if (!result.success) {
            alert(result.error || 'Request already accepted by another pharmacy.');
        }
        setProcessingId(null);
    };

    const handleReject = async (requestId) => {
        setProcessingId(requestId);
        await rejectMedicineRequest(requestId, state.user.uid);
        setProcessingId(null);
    };

    const handleStatusUpdate = async (requestId, newStatus) => {
        setProcessingId(requestId);
        try {
            await updateRequestStatus(requestId, newStatus);
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
        setProcessingId(null);
    };

    const getNextStatus = (currentStatus, deliveryOption) => {
        const isDelivery = deliveryOption === 'delivery';
        const flow = {
            accepted: { next: 'preparing', label: '📦 Start Preparing', color: '#F59E0B' },
            preparing: { next: 'ready', label: isDelivery ? '🚚 Mark Out for Delivery' : '✅ Mark Ready for Pickup', color: '#22C55E' },
            ready: { next: 'completed', label: '🎉 Mark Completed', color: '#3B82F6' },
        };
        return flow[currentStatus] || null;
    };

    const filteredRequests = requests.filter(r => {
        // Don't show requests this pharmacy rejected
        if (r.rejectedBy && r.rejectedBy.includes(state.user?.uid)) return false;
        if (filter === 'pending') return r.status === 'requested';
        if (filter === 'accepted') return r.status !== 'requested' && r.acceptedBy === state.user?.uid;
        return true;
    });



    return (
        <div className="pr-page">
            <div className="pr-header">
                <button className="pd-icon-btn" onClick={() => navigate('/pharmacy-dashboard')}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="inv-title">Medicine Requests</h1>
            </div>

            <div className="pr-filters">
                {[['pending', '📡 Pending'], ['accepted', '✅ My Accepted'], ['all', '📋 All']].map(([val, label]) => (
                    <button key={val} className={`chip ${filter === val ? 'active' : ''}`}
                        onClick={() => setFilter(val)}>{label}</button>
                ))}
            </div>

            <div className="pr-list">
                {filteredRequests.length === 0 && (
                    <div className="empty-state" style={{ padding: '48px 16px' }}>
                        <ClipboardList size={48} />
                        <h3>No requests</h3>
                        <p>{filter === 'pending' ? 'No pending medicine requests right now.' : 'No matching requests found.'}</p>
                    </div>
                )}

                {filteredRequests.map(req => {
                    const dist = calculateDistance(pharmacy?.lat, pharmacy?.lng, req.userLat, req.userLng);
                    const isAcceptedByOther = req.status !== 'requested' && req.acceptedBy !== state.user?.uid;
                    const isAcceptedByMe = req.acceptedBy === state.user?.uid;
                    const createdAt = req.createdAt?.toDate ? req.createdAt.toDate() : new Date();
                    const nextStatus = isAcceptedByMe ? getNextStatus(req.status, req.deliveryOption) : null;

                    return (
                        <div key={req.id} className={`pr-card ${isAcceptedByMe ? 'pr-mine' : ''}`}>
                            <div className="pr-card-top">
                                <div className="pr-card-med">
                                    <span className="pr-card-icon">💊</span>
                                    <div>
                                        <h4 className="pr-card-name">{req.medicineName}</h4>
                                        <span className="pr-card-qty">Qty: {req.quantity} {req.quantity > 1 ? 'strips' : 'strip'}</span>
                                    </div>
                                </div>
                                <div className="pr-card-meta">
                                    {req.urgency === 'urgent' && (
                                        <span className="pr-urgency-badge">🚨 Urgent</span>
                                    )}
                                    <span className={`pr-status-badge pr-status-${req.status}`}>
                                        {req.status === 'requested' ? 'Pending' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="pr-card-details">
                                {dist !== null && (
                                    <span className="pr-detail"><MapPin size={13} /> {dist.toFixed(1)} km away</span>
                                )}
                                <span className="pr-detail"><Clock size={13} /> {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="pr-detail">🚚 {req.deliveryOption === 'delivery' ? 'Home Delivery' : 'Pickup'}</span>
                            </div>

                            {req.prescriptionUrl && (
                                <a href={req.prescriptionUrl} target="_blank" rel="noreferrer" className="pr-prescription-link">
                                    📄 View Prescription
                                </a>
                            )}

                            {req.status === 'requested' && (
                                <div className="pr-card-actions">
                                    <button className="btn btn-primary btn-sm" onClick={() => handleAccept(req.id)}
                                        disabled={processingId === req.id}>
                                        {processingId === req.id ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                                        Accept
                                    </button>
                                    <button className="btn btn-outline btn-sm" onClick={() => handleReject(req.id)}
                                        disabled={processingId === req.id} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            )}

                            {isAcceptedByOther && (
                                <div className="pr-accepted-msg">
                                    <AlertTriangle size={14} /> Request already accepted by another pharmacy.
                                </div>
                            )}

                            {isAcceptedByMe && (
                                <div className="pr-mine-msg">
                                    <CheckCircle size={14} /> You accepted this request
                                    {req.status !== 'requested' && (
                                        <span className="pr-current-status"> — Status: <strong>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</strong></span>
                                    )}
                                </div>
                            )}

                            {/* Status progression buttons for pharmacy */}
                            {isAcceptedByMe && nextStatus && (
                                <div className="pr-status-update">
                                    <button
                                        className="btn btn-sm pr-status-btn"
                                        style={{ background: nextStatus.color, color: '#fff', border: 'none' }}
                                        onClick={() => handleStatusUpdate(req.id, nextStatus.next)}
                                        disabled={processingId === req.id}
                                    >
                                        {processingId === req.id ? <Loader2 size={14} className="spin" /> : null}
                                        {nextStatus.label}
                                    </button>
                                </div>
                            )}

                            {isAcceptedByMe && req.status === 'completed' && (
                                <div className="pr-completed-msg">
                                    🎉 This request has been fulfilled!
                                </div>
                            )}
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
                <button className="pd-nav-item active" onClick={() => navigate('/pharmacy-requests')}>
                    <ClipboardList size={20} /><span>Requests</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-orders')}>
                    <ShoppingBag size={20} /><span>Orders</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-owner-profile')}>
                    <User size={20} /><span>Profile</span>
                </button>
            </nav>
        </div>
    );
}
