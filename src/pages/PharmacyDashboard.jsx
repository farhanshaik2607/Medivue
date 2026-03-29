import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, Clock, Users, Plus, ClipboardList, Settings, User, Bell, TrendingUp, ShieldCheck, ShoppingBag, MapPin, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPharmacyProfile, subscribeToInventory, subscribeToPharmacyOrders, updateOrderStatus } from '../services/firestoreService';
import './PharmacyDashboard.css';

export default function PharmacyDashboard() {
    const { state, handleLogout, fetchLocation } = useApp();
    const navigate = useNavigate();
    const [pharmacy, setPharmacy] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (!state.user?.uid) return;

        const loadProfile = async () => {
            try {
                const profile = await getPharmacyProfile(state.user.uid);
                setPharmacy(profile);
            } catch (err) {
                console.error('Error loading pharmacy profile:', err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();

        // Subscribe to inventory changes
        const unsubInv = subscribeToInventory(state.user.uid, (items) => {
            setInventory(items);
        });

        // Subscribe to incoming orders to show notifications
        const unsubOrders = subscribeToPharmacyOrders(state.user.uid, (allOrders) => {
            setPendingOrders(allOrders.filter(o => o.status === 'pending'));
        });

        return () => {
            unsubInv();
            unsubOrders();
        };
    }, [state.user?.uid]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        setProcessingId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Failed to update order status');
        } finally {
            setProcessingId(null);
        }
    };

    const lowStockItems = inventory.filter(i => i.qty <= (i.lowStockThreshold || 10));
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringItems = inventory.filter(i => {
        if (!i.expiryDate) return false;
        const exp = new Date(i.expiryDate);
        return exp <= thirtyDaysFromNow;
    });



    return (
        <div className="pd-page">
            {/* Header */}
            <div className="pd-header">
                <div className="pd-header-left">
                    <span className="pd-header-icon">🏥</span>
                    <div>
                        <h1 className="pd-header-title">{pharmacy?.name || 'My Pharmacy'}</h1>
                        <p className="pd-header-subtitle">Dashboard</p>
                    </div>
                </div>
                <div className="pd-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                        className="pd-location-btn" 
                        onClick={fetchLocation} 
                        style={{ 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', 
                            background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '20px', 
                            fontSize: '0.85rem', fontWeight: '500', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            border: '1px solid var(--border-color)', color: 'var(--text-color)'
                        }}
                    >
                        <MapPin size={16} color="var(--primary)" />
                        <span className="loc-text">{state.location.city || state.location.address || 'Detect Location'}</span>
                        <ChevronDown size={14} color="var(--gray-500)" />
                    </div>
                    <button className="pd-icon-btn" style={{ position: 'relative' }} onClick={() => navigate('/pharmacy-orders')}>
                        <Bell size={20} />
                        {pendingOrders.length > 0 && (
                            <span style={{
                                position: 'absolute', top: '0px', right: '0px',
                                background: 'var(--danger)', color: 'white',
                                fontSize: '10px', fontWeight: 'bold',
                                width: '16px', height: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '50%'
                            }}>
                                {pendingOrders.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="pd-stats">
                <div className="pd-stat-card">
                    <div className="pd-stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}><Package size={20} /></div>
                    <div className="pd-stat-info">
                        <span className="pd-stat-value">{inventory.length}</span>
                        <span className="pd-stat-label">Total Medicines</span>
                    </div>
                </div>
                <div className="pd-stat-card">
                    <div className="pd-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><AlertTriangle size={20} /></div>
                    <div className="pd-stat-info">
                        <span className="pd-stat-value">{lowStockItems.length}</span>
                        <span className="pd-stat-label">Low Stock</span>
                    </div>
                </div>
                <div className="pd-stat-card">
                    <div className="pd-stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}><Clock size={20} /></div>
                    <div className="pd-stat-info">
                        <span className="pd-stat-value">{expiringItems.length}</span>
                        <span className="pd-stat-label">Expiring Soon</span>
                    </div>
                </div>
                <div className="pd-stat-card">
                    <div className="pd-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}><TrendingUp size={20} /></div>
                    <div className="pd-stat-info">
                        <span className="pd-stat-value">Active</span>
                        <span className="pd-stat-label">Store Status</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="pd-section">
                <h2 className="pd-section-title">Quick Actions</h2>
                <div className="pd-actions-grid">
                    <button className="pd-action-card" onClick={() => navigate('/pharmacy-inventory')}>
                        <div className="pd-action-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><Package size={22} /></div>
                        <span className="pd-action-label">Manage Inventory</span>
                    </button>
                    <button className="pd-action-card" onClick={() => navigate('/pharmacy-requests')}>
                        <div className="pd-action-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}><ClipboardList size={22} /></div>
                        <span className="pd-action-label">View Requests</span>
                    </button>
                    <button className="pd-action-card" onClick={() => navigate('/pharmacy-inventory')}>
                        <div className="pd-action-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}><Plus size={22} /></div>
                        <span className="pd-action-label">Add Medicine</span>
                    </button>
                    <button className="pd-action-card" onClick={() => navigate('/pharmacy-orders')}>
                        <div className="pd-action-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><ShoppingBag size={22} /></div>
                        <span className="pd-action-label">Manage Orders</span>
                    </button>
                </div>
            </div>

            {/* Notification Alerts for New Orders */}
            {pendingOrders.length > 0 && (
                <div className="pd-section">
                    <h2 className="pd-section-title" style={{ color: 'var(--primary)' }}>🔔 New Order Requests</h2>
                    <div className="pd-alerts">
                        {pendingOrders.map(order => (
                            <div key={order.id} className="pd-alert-card" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary-200)', flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span className="pd-alert-name" style={{ color: 'var(--primary-dark)' }}>Order #{order.id.slice(-6).toUpperCase()}</span>
                                        <span className="pd-alert-detail" style={{ fontSize: '13px' }}>From {order.userName} • {order.items?.length} items • <strong>₹{order.total}</strong></span>
                                        {order.deliveryMode === 'delivery' && (
                                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--primary)', marginTop: '4px', fontWeight: '500' }}>
                                                <MapPin size={10} style={{ display: 'inline', marginRight: '4px' }}/> 
                                                Delivery to {order.deliveryAddress?.city || 'Local'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="pd-alert-badge" style={{ background: 'var(--primary)', color: 'white' }}>New</span>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        className="btn btn-primary btn-sm" 
                                        style={{ flex: 1 }} 
                                        onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                        disabled={processingId === order.id}
                                    >
                                        {processingId === order.id ? 'Processing...' : 'Accept Order'}
                                    </button>
                                    <button 
                                        className="btn btn-outline btn-sm" 
                                        style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} 
                                        onClick={() => handleUpdateStatus(order.id, 'rejected')}
                                        disabled={processingId === order.id}
                                    >
                                        {processingId === order.id ? '...' : 'Reject'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Alerts */}
            {(lowStockItems.length > 0 || expiringItems.length > 0) && (
                <div className="pd-section">
                    <h2 className="pd-section-title">⚠️ Inventory Alerts</h2>
                    <div className="pd-alerts">
                        {lowStockItems.slice(0, 5).map(item => (
                            <div key={item.id} className="pd-alert-card pd-alert-warning">
                                <div className="pd-alert-dot warning"></div>
                                <div className="pd-alert-info">
                                    <span className="pd-alert-name">{item.name}</span>
                                    <span className="pd-alert-detail">Only {item.qty} left in stock</span>
                                </div>
                                <span className="pd-alert-badge warning">Low Stock</span>
                            </div>
                        ))}
                        {expiringItems.slice(0, 5).map(item => (
                            <div key={item.id} className="pd-alert-card pd-alert-danger">
                                <div className="pd-alert-dot danger"></div>
                                <div className="pd-alert-info">
                                    <span className="pd-alert-name">{item.name}</span>
                                    <span className="pd-alert-detail">Expires: {item.expiryDate}</span>
                                </div>
                                <span className="pd-alert-badge danger">Expiring</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pharmacy Info */}
            {pharmacy && (
                <div className="pd-section">
                    <h2 className="pd-section-title">Pharmacy Info</h2>
                    <div className="pd-info-card">
                        <div className="pd-info-row"><span className="pd-info-label">Address</span><span className="pd-info-value">{pharmacy.address || 'Not set'}</span></div>
                        <div className="pd-info-row"><span className="pd-info-label">Phone</span><span className="pd-info-value">{pharmacy.phone || 'Not set'}</span></div>
                        <div className="pd-info-row"><span className="pd-info-label">Hours</span><span className="pd-info-value">{pharmacy.openTime} – {pharmacy.closeTime}</span></div>
                        <div className="pd-info-row"><span className="pd-info-label">License</span><span className="pd-info-value">{pharmacy.licenseNumber || 'Not set'}</span></div>
                        <div className="pd-info-row"><span className="pd-info-label">Delivery</span><span className="pd-info-value">{pharmacy.deliveryAvailable ? '✅ Available' : '❌ Not available'}</span></div>
                    </div>
                </div>
            )}

            {/* Bottom Nav for Pharmacy */}
            <nav className="pd-bottom-nav">
                <button className="pd-nav-item active" onClick={() => navigate('/pharmacy-dashboard')}>
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
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-owner-profile')}>
                    <User size={20} />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
}
