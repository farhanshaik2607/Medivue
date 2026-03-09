import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Locate, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import './Splash.css';

export default function Splash() {
    const { dispatch } = useApp();
    const navigate = useNavigate();
    const [step, setStep] = useState('welcome'); // welcome | location | auth
    const [isLogin, setIsLogin] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDetectLocation = () => {
        dispatch({
            type: 'SET_LOCATION',
            payload: { lat: 17.8484, lng: 78.6832, address: 'Gajwel, Siddipet District, Telangana' }
        });
        setStep('auth');
    };

    const handleManualLocation = () => {
        dispatch({
            type: 'SET_LOCATION',
            payload: { lat: 17.8484, lng: 78.6832, address: 'Gajwel, Siddipet District, Telangana' }
        });
        setStep('auth');
    };

    const handleAuth = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!email || !password || (!isLogin && !name)) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (name) {
                    await updateProfile(userCredential.user, { displayName: name });
                }
            }
            // The onAuthStateChanged listener in AppContext will catch the login and update global state
            navigate('/');
        } catch (err) {
            console.error(err);
            // Clean up Firebase error messages for the user
            let message = err.message;
            if (err.code === 'auth/email-already-in-use') message = 'Email is already registered. Please log in.';
            else if (err.code === 'auth/invalid-credential') message = 'Invalid email or password.';
            else if (err.code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/');
        } catch (err) {
            console.error(err);
            let message = err.message;
            if (err.code === 'auth/popup-closed-by-user') message = 'Google sign in was cancelled.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        dispatch({ type: 'SET_LOCATION', payload: { lat: 17.8484, lng: 78.6832, address: 'Gajwel, Siddipet District, Telangana' } });
        dispatch({ type: 'SET_LOGGED_IN' }); // fallback to bypass auth entirely
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
                            defaultValue="Gajwel, Telangana"
                            id="manual-location-input"
                        />
                    </div>
                    <button className="btn btn-secondary btn-block" style={{ marginTop: '12px' }} onClick={handleManualLocation}>
                        Set Manually
                    </button>
                </div>
            )}

            {step === 'auth' && (
                <div className="splash-content animate-slide-up">
                    <div className="splash-location-icon">👤</div>
                    <h2 className="heading-lg">{isLogin ? 'Welcome Back' : 'Quick Sign Up'}</h2>
                    <p className="text-sm" style={{ textAlign: 'center', marginBottom: '24px' }}>
                        {isLogin ? 'Log in to access your orders and saved locations' : 'Create your account to track orders and save prescriptions'}
                    </p>

                    {error && (
                        <div className="alert alert-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '14px' }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuth} style={{ width: '100%' }}>
                        {!isLogin && (
                            <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
                                <label className="form-label" htmlFor="name">Your Name</label>
                                <input
                                    className="form-input"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    id="name"
                                    name="name"
                                    autoComplete="name"
                                    disabled={loading}
                                />
                            </div>
                        )}
                        <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
                            <label className="form-label" htmlFor="email">Email</label>
                            <input
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                className="form-input"
                                placeholder={isLogin ? "Enter password" : "Create a password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: '16px' }} disabled={loading}>
                            {loading ? (
                                <><Loader2 size={18} className="spin" /> Processing...</>
                            ) : (
                                isLogin ? 'Log In' : 'Continue to MediVue+'
                            )}
                        </button>
                    </form>

                    <div className="splash-or" style={{ margin: '20px 0' }}>
                        <span>or</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-lg btn-block"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
                        <span style={{ color: 'var(--gray-500)' }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            className="text-primary"
                            style={{ background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </div>

                    <button className="splash-skip" onClick={handleSkip} style={{ marginTop: '32px' }} disabled={loading}>Skip sign in for now</button>
                </div>
            )}
        </div>
    );
}
