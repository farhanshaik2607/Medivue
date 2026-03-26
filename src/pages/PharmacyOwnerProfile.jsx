import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LogOut, User, TrendingUp, Package, ClipboardList, ShoppingBag, Store } from 'lucide-react';
import './PharmacyDashboard.css';

export default function PharmacyOwnerProfile() {
    const { state, handleLogout } = useApp();
    const navigate = useNavigate();
    const pharmacy = state.user || {};

    const doLogout = async () => {
        await handleLogout();
        navigate('/role-select');
    };

    return (
        <div className="pd-page" style={{ paddingBottom: '80px' }}>
            <div className="pd-header">
                <div className="pd-header-left">
                    <span className="pd-header-icon">🏥</span>
                    <div>
                        <h1 className="pd-header-title">Pharmacy Profile</h1>
                        <p className="pd-header-subtitle">Manage your account</p>
                    </div>
                </div>
            </div>

            <div className="pd-section" style={{ marginTop: '24px' }}>
                <div className="card card-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store size={40} />
                    </div>
                    <h2 style={{ marginBottom: '8px' }}>{pharmacy.name || 'Pharmacy Name'}</h2>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>{pharmacy.email || 'pharmacy@example.com'}</p>
                    
                    <button className="btn btn-outline btn-block" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={doLogout}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            <nav className="pd-bottom-nav">
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-dashboard')}>
                    <TrendingUp size={20} />
                    <span>Dashboard</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-inventory')}>
                    <Package size={20} />
                    <span>Inventory</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-requests')}>
                    <ClipboardList size={20} />
                    <span>Requests</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-orders')}>
                    <ShoppingBag size={20} />
                    <span>Orders</span>
                </button>
                <button className="pd-nav-item active" onClick={() => navigate('/pharmacy-owner-profile')}>
                    <User size={20} />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
}
