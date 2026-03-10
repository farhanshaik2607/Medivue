import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { createPharmacyProfile, createUserProfile, getUserProfile } from '../services/firestoreService';
import { useApp } from '../context/AppContext';
import './PharmacyLogin.css';

export default function PharmacyLogin() {
    const { dispatch, markLoginHandled } = useApp();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pharmacyName, setPharmacyName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Helper: finish login and set all state at once
    const finishLogin = (user, role, displayName) => {
        dispatch({ type: 'SET_USER_ROLE', payload: role });
        dispatch({
            type: 'SET_USER',
            payload: { uid: user.uid, email: user.email, name: displayName || user.email.split('@')[0] }
        });
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    };

    const handleAuth = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (isLogin) {
            if (!email || !password) { setError('Please fill in all fields'); return; }
        } else {
            if (!email || !password || !pharmacyName || !ownerName || !address || !phone) {
                setError('Please fill in all required fields'); return;
            }
        }

        setLoading(true);
        try {
            // Tell onAuthStateChanged to skip — we'll handle state ourselves
            markLoginHandled();

            if (isLogin) {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                const profile = await getUserProfile(cred.user.uid);
                if (!profile || profile.role !== 'pharmacy') {
                    setError('This account is not a Pharmacy account. Please use User login.');
                    await auth.signOut();
                    setLoading(false);
                    return;
                }
                finishLogin(cred.user, 'pharmacy', cred.user.displayName || profile.name);
                navigate('/pharmacy-dashboard');
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(cred.user, { displayName: ownerName });
                await createPharmacyProfile(cred.user.uid, {
                    name: ownerName, email, pharmacyName, address, phone, licenseNumber,
                });
                finishLogin(cred.user, 'pharmacy', ownerName);
                navigate('/pharmacy-dashboard');
            }
        } catch (err) {
            console.error(err);
            let message = err.message;
            if (err.code === 'auth/email-already-in-use') message = 'Email already registered. Please log in.';
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
            // Tell onAuthStateChanged to skip
            markLoginHandled();

            const cred = await signInWithPopup(auth, googleProvider);
            const profile = await getUserProfile(cred.user.uid);
            if (profile && profile.role === 'user') {
                setError('This Google account is a User account. Please use User login.');
                await auth.signOut();
                setLoading(false);
                return;
            }
            if (!profile) {
                await createPharmacyProfile(cred.user.uid, {
                    name: cred.user.displayName || 'Owner',
                    email: cred.user.email,
                    pharmacyName: `${cred.user.displayName || 'My'}'s Pharmacy`,
                    address: '', phone: '', licenseNumber: '',
                });
            }
            finishLogin(cred.user, 'pharmacy', cred.user.displayName || profile?.name || 'Owner');
            navigate('/pharmacy-dashboard');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/popup-closed-by-user') setError('Google sign in was cancelled.');
            else setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pharmacy-login-page page-plain">
            <div className="pharmacy-login-bg">
                <div className="pl-circle c1"></div>
                <div className="pl-circle c2"></div>
            </div>

            <div className="pharmacy-login-content animate-fade-in">
                <button className="pl-back" onClick={() => navigate('/role-select')}>
                    <ArrowLeft size={20} />
                </button>

                <div className="pl-header">
                    <div className="pl-icon">🏥</div>
                    <h2 className="heading-lg">{isLogin ? 'Pharmacy Login' : 'Register Pharmacy'}</h2>
                    <p className="text-sm" style={{ textAlign: 'center', marginBottom: '16px' }}>
                        {isLogin ? 'Log in to manage your pharmacy inventory and requests' : 'Register your pharmacy to start receiving medicine requests'}
                    </p>
                </div>

                {error && (
                    <div className="pl-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} className="pl-form">
                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label className="form-label" htmlFor="ownerName">Owner Name *</label>
                                <input className="form-input" placeholder="Your full name" value={ownerName}
                                    onChange={e => setOwnerName(e.target.value)} id="ownerName" disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="pharmacyName">Pharmacy Name *</label>
                                <input className="form-input" placeholder="e.g. Apollo Pharmacy" value={pharmacyName}
                                    onChange={e => setPharmacyName(e.target.value)} id="pharmacyName" disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="address">Address *</label>
                                <input className="form-input" placeholder="Full pharmacy address" value={address}
                                    onChange={e => setAddress(e.target.value)} id="address" disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="phone">Phone Number *</label>
                                <input className="form-input" placeholder="+91 98765 43210" value={phone}
                                    onChange={e => setPhone(e.target.value)} id="phone" type="tel" disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="licenseNumber">License Number</label>
                                <input className="form-input" placeholder="Drug license number (optional)" value={licenseNumber}
                                    onChange={e => setLicenseNumber(e.target.value)} id="licenseNumber" disabled={loading} />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="pl-email">Email *</label>
                        <input className="form-input" placeholder="Enter your email" value={email}
                            onChange={e => setEmail(e.target.value)} id="pl-email" type="email" autoComplete="email" disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="pl-password">Password *</label>
                        <input className="form-input" placeholder={isLogin ? 'Enter password' : 'Create a password (min 6 chars)'}
                            value={password} onChange={e => setPassword(e.target.value)} id="pl-password"
                            type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} disabled={loading} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: '16px' }} disabled={loading}>
                        {loading ? (
                            <><Loader2 size={18} className="spin" /> Processing...</>
                        ) : (
                            isLogin ? 'Log In' : 'Register Pharmacy'
                        )}
                    </button>
                </form>

                <div className="splash-or" style={{ margin: '20px 0' }}>
                    <span>or</span>
                </div>

                <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--white)', border: '1px solid var(--gray-200)', color: 'var(--gray-800)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
                    <span style={{ color: 'var(--gray-500)' }}>
                        {isLogin ? "Don't have a pharmacy account? " : "Already registered? "}
                    </span>
                    <button className="text-primary" style={{ background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                        {isLogin ? 'Register' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
