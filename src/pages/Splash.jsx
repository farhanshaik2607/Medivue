import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Locate, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Splash.css';

export default function Splash() {
    const { dispatch } = useApp();
    const navigate = useNavigate();
    const [step, setStep] = useState('welcome'); // welcome | location | signup
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleDetectLocation = () => {
        dispatch({
            type: 'SET_LOCATION',
            payload: { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' }
        });
        setStep('signup');
    };

    const handleManualLocation = () => {
        dispatch({
            type: 'SET_LOCATION',
            payload: { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' }
        });
        setStep('signup');
    };

    const handleGetStarted = () => {
        dispatch({ type: 'SET_LOGGED_IN' });
        navigate('/');
    };

    const handleSkip = () => {
        dispatch({ type: 'SET_LOCATION', payload: { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' } });
        dispatch({ type: 'SET_LOGGED_IN' });
        navigate('/');
    };

    return (
        <div className="splash-page page-plain">
            <div className="splash-bg">
                <div className="splash-circle c1"></div>
                <div className="splash-circle c2"></div>
                <div className="splash-circle c3"></div>
            </div>

            {step === 'welcome' && (
                <div className="splash-content animate-fade-in">
                    <div className="splash-logo">
                        <div className="splash-logo-icon">💊</div>
                        <h1 className="splash-title">Medi<span>Vue+</span></h1>
                        <p className="splash-tagline">Find medicines near you.<br />Compare prices. Get delivered fast.</p>
                    </div>
                    <div className="splash-features">
                        <div className="splash-feature">
                            <span className="sf-icon">🔍</span>
                            <span>Search by brand or salt formula</span>
                        </div>
                        <div className="splash-feature">
                            <span className="sf-icon">📍</span>
                            <span>Find pharmacies within walking distance</span>
                        </div>
                        <div className="splash-feature">
                            <span className="sf-icon">💰</span>
                            <span>Compare prices across stores</span>
                        </div>
                        <div className="splash-feature">
                            <span className="sf-icon">🚴</span>
                            <span>Get medicines delivered in minutes</span>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-lg btn-block" onClick={() => setStep('location')}>
                        Get Started <ChevronRight size={18} />
                    </button>
                    <button className="splash-skip" onClick={handleSkip}>Skip for now</button>
                </div>
            )}

            {step === 'location' && (
                <div className="splash-content animate-slide-up">
                    <div className="splash-location-icon">📍</div>
                    <h2 className="heading-lg">Where are you?</h2>
                    <p className="text-sm" style={{ textAlign: 'center', marginBottom: '24px' }}>
                        We need your location to show nearby pharmacies and medicine availability
                    </p>
                    <button className="btn btn-primary btn-lg btn-block" onClick={handleDetectLocation}>
                        <Locate size={18} />
                        Detect My Location
                    </button>
                    <div className="splash-or">
                        <span>or</span>
                    </div>
                    <div className="input-group">
                        <MapPin size={16} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Enter your area or pincode"
                            defaultValue="Koramangala, Bangalore"
                            id="manual-location-input"
                        />
                    </div>
                    <button className="btn btn-secondary btn-block" style={{ marginTop: '12px' }} onClick={handleManualLocation}>
                        Set Manually
                    </button>
                </div>
            )}

            {step === 'signup' && (
                <div className="splash-content animate-slide-up">
                    <div className="splash-location-icon">👤</div>
                    <h2 className="heading-lg">Quick Sign Up</h2>
                    <p className="text-sm" style={{ textAlign: 'center', marginBottom: '24px' }}>
                        Create your account to track orders and save prescriptions
                    </p>
                    <div className="form-group">
                        <label className="form-label">Your Name</label>
                        <input className="form-input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} id="signup-name" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input className="form-input" style={{ width: '70px', flexShrink: 0 }} value="+91" readOnly />
                            <input className="form-input" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} id="signup-phone" type="tel" />
                        </div>
                    </div>
                    <button className="btn btn-primary btn-lg btn-block" onClick={handleGetStarted} style={{ marginTop: '8px' }}>
                        Continue to MediVue+
                    </button>
                    <button className="splash-skip" onClick={handleGetStarted}>Skip sign up</button>
                </div>
            )}
        </div>
    );
}
