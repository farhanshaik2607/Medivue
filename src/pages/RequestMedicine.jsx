import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createMedicineRequest, uploadPrescriptionImage } from '../services/firestoreService';
import './RequestMedicine.css';

export default function RequestMedicine() {
    const { state } = useApp();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const prefillName = searchParams.get('name') || '';

    const [medicineName, setMedicineName] = useState(prefillName);
    const [quantity, setQuantity] = useState('1');
    const [urgency, setUrgency] = useState('normal'); // normal | urgent
    const [deliveryOption, setDeliveryOption] = useState('pickup'); // pickup | delivery
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!medicineName.trim() || !quantity) {
            setError('Please fill in the medicine name and quantity.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            let prescriptionUrl = null;
            if (prescriptionFile) {
                prescriptionUrl = await uploadPrescriptionImage(state.user.uid, prescriptionFile);
            }

            await createMedicineRequest({
                userId: state.user.uid,
                userName: state.user.name || state.user.email,
                medicineName: medicineName.trim(),
                quantity: parseInt(quantity),
                urgency,
                deliveryOption,
                prescriptionUrl,
                userLat: state.location.lat,
                userLng: state.location.lng,
                userAddress: state.location.address,
            });

            setSuccess(true);
        } catch (err) {
            console.error('Request error:', err);
            setError('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="rm-page page-plain">
                <div className="rm-success animate-scale-in">
                    <CheckCircle size={64} color="var(--success)" />
                    <h2 className="heading-lg">Request Submitted!</h2>
                    <p className="text-sm" style={{ textAlign: 'center', color: 'var(--gray-500)', marginBottom: '24px' }}>
                        Your request for <strong>{medicineName}</strong> has been broadcast to nearby pharmacies. You'll be notified when a pharmacy accepts.
                    </p>
                    <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/my-requests')}>
                        Track My Requests
                    </button>
                    <button className="btn btn-outline btn-lg btn-block" style={{ marginTop: '12px' }} onClick={() => navigate('/')}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rm-page page">
            <div className="rm-header">
                <button className="search-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="rm-title">Request Medicine</h1>
            </div>

            <div className="rm-content">
                <div className="rm-info-banner">
                    <span className="rm-info-icon">📡</span>
                    <p>Your request will be broadcast to all nearby pharmacies (5-10 km). The first pharmacy to accept will fulfill your order.</p>
                </div>

                {error && (
                    <div className="pl-error" style={{ marginBottom: '16px' }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Medicine Name *</label>
                        <input className="form-input" placeholder="e.g. Paracetamol 650mg" value={medicineName}
                            onChange={e => setMedicineName(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Quantity *</label>
                        <input className="form-input" type="number" min="1" placeholder="e.g. 2 strips" value={quantity}
                            onChange={e => setQuantity(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Urgency Level</label>
                        <div className="rm-toggle-group">
                            <button type="button" className={`rm-toggle ${urgency === 'normal' ? 'active' : ''}`}
                                onClick={() => setUrgency('normal')}>
                                <span>🕐</span> Normal
                            </button>
                            <button type="button" className={`rm-toggle ${urgency === 'urgent' ? 'active urgent' : ''}`}
                                onClick={() => setUrgency('urgent')}>
                                <span>🚨</span> Urgent
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Delivery Option</label>
                        <div className="rm-toggle-group">
                            <button type="button" className={`rm-toggle ${deliveryOption === 'pickup' ? 'active' : ''}`}
                                onClick={() => setDeliveryOption('pickup')}>
                                <span>🏪</span> Pickup
                            </button>
                            <button type="button" className={`rm-toggle ${deliveryOption === 'delivery' ? 'active' : ''}`}
                                onClick={() => setDeliveryOption('delivery')}>
                                <span>🚴</span> Home Delivery
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Prescription (optional)</label>
                        <label className="rm-upload-area">
                            <input type="file" accept="image/*,.pdf" hidden
                                onChange={e => setPrescriptionFile(e.target.files[0])} />
                            {prescriptionFile ? (
                                <div className="rm-upload-done">
                                    <CheckCircle size={20} color="var(--success)" />
                                    <span>{prescriptionFile.name}</span>
                                </div>
                            ) : (
                                <div className="rm-upload-placeholder">
                                    <Upload size={24} />
                                    <span>Tap to upload prescription image</span>
                                </div>
                            )}
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}
                        style={{ marginTop: '16px' }}>
                        {loading ? <><Loader2 size={18} className="spin" /> Submitting...</> : '📡 Broadcast Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}
