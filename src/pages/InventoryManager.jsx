import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit3, Trash2, X, Package, AlertTriangle, Clock, TrendingUp, ClipboardList, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addInventoryItem, updateInventoryItem, deleteInventoryItem, subscribeToInventory } from '../services/firestoreService';
import { categories } from '../data/medicines';
import './InventoryManager.css';

export default function InventoryManager() {
    const { state, handleLogout } = useApp();
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all | low | expiring
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '', salt: '', category: 'Pain Relief', price: '', mrp: '',
        qty: '', expiryDate: '', lowStockThreshold: '10',
    });

    useEffect(() => {
        if (!state.user?.uid) return;
        const unsub = subscribeToInventory(state.user.uid, (items) => {
            setInventory(items);
        });
        return () => unsub();
    }, [state.user?.uid]);

    const resetForm = () => {
        setForm({ name: '', salt: '', category: 'Pain Relief', price: '', mrp: '', qty: '', expiryDate: '', lowStockThreshold: '10' });
        setEditItem(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.price || !form.qty) return;
        setLoading(true);

        const data = {
            name: form.name,
            salt: form.salt,
            category: form.category,
            price: parseFloat(form.price),
            mrp: parseFloat(form.mrp) || parseFloat(form.price),
            qty: parseInt(form.qty),
            expiryDate: form.expiryDate || null,
            lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
        };

        try {
            if (editItem) {
                await updateInventoryItem(state.user.uid, editItem.id, data);
            } else {
                await addInventoryItem(state.user.uid, data);
            }
            resetForm();
        } catch (err) {
            console.error('Error saving item:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setForm({
            name: item.name, salt: item.salt || '', category: item.category || 'Pain Relief',
            price: String(item.price), mrp: String(item.mrp || ''), qty: String(item.qty),
            expiryDate: item.expiryDate || '', lowStockThreshold: String(item.lowStockThreshold || 10),
        });
        setEditItem(item);
        setShowForm(true);
    };

    const handleDelete = async (itemId) => {
        if (!confirm('Delete this medicine from inventory?')) return;
        try {
            await deleteInventoryItem(state.user.uid, itemId);
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const today = new Date();
    const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const getStatus = (item) => {
        if (item.qty <= (item.lowStockThreshold || 10)) return 'low';
        if (item.expiryDate && new Date(item.expiryDate) <= thirtyDays) return 'expiring';
        return 'ok';
    };

    const filtered = inventory.filter(item => {
        const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.salt && item.salt.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filter === 'low') return matchesSearch && getStatus(item) === 'low';
        if (filter === 'expiring') return matchesSearch && getStatus(item) === 'expiring';
        return matchesSearch;
    });

    const doLogout = async () => { await handleLogout(); navigate('/role-select'); };

    return (
        <div className="inv-page">
            {/* Header */}
            <div className="inv-header">
                <button className="pd-icon-btn" onClick={() => navigate('/pharmacy-dashboard')}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="inv-title">Inventory</h1>
                <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus size={16} /> Add
                </button>
            </div>

            {/* Search + Filter */}
            <div className="inv-controls">
                <div className="inv-search">
                    <Search size={16} />
                    <input type="text" placeholder="Search medicines..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="inv-filters">
                    {[['all', 'All'], ['low', '🔴 Low'], ['expiring', '🟡 Expiring']].map(([val, label]) => (
                        <button key={val} className={`chip ${filter === val ? 'active' : ''}`}
                            onClick={() => setFilter(val)}>{label}</button>
                    ))}
                </div>
            </div>

            {/* Inventory List */}
            <div className="inv-list">
                {filtered.length === 0 && (
                    <div className="empty-state" style={{ padding: '48px 16px' }}>
                        <Package size={48} />
                        <h3>No medicines found</h3>
                        <p>{inventory.length === 0 ? 'Add your first medicine to get started' : 'Try a different search or filter'}</p>
                    </div>
                )}
                {filtered.map(item => {
                    const status = getStatus(item);
                    return (
                        <div key={item.id} className={`inv-card inv-${status}`}>
                            <div className="inv-card-main">
                                <div className="inv-card-left">
                                    <span className="inv-status-dot"></span>
                                    <div className="inv-card-info">
                                        <span className="inv-card-name">{item.name}</span>
                                        {item.salt && <span className="inv-card-salt">{item.salt}</span>}
                                        <span className="inv-card-cat">{item.category}</span>
                                    </div>
                                </div>
                                <div className="inv-card-right">
                                    <span className="inv-card-price">₹{item.price}</span>
                                    <span className="inv-card-qty">Qty: {item.qty}</span>
                                    {item.expiryDate && <span className="inv-card-exp">Exp: {item.expiryDate}</span>}
                                </div>
                            </div>
                            <div className="inv-card-actions">
                                <button className="inv-action-btn edit" onClick={() => handleEdit(item)}>
                                    <Edit3 size={14} /> Edit
                                </button>
                                <button className="inv-action-btn delete" onClick={() => handleDelete(item.id)}>
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <>
                    <div className="overlay" onClick={resetForm}></div>
                    <div className="inv-modal animate-slide-up">
                        <div className="inv-modal-header">
                            <h3>{editItem ? 'Edit Medicine' : 'Add Medicine'}</h3>
                            <button onClick={resetForm}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="inv-modal-form">
                            <div className="form-group">
                                <label className="form-label">Medicine Name *</label>
                                <input className="form-input" placeholder="e.g. Dolo 650" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Salt / Composition</label>
                                <input className="form-input" placeholder="e.g. Paracetamol 650mg" value={form.salt}
                                    onChange={e => setForm(f => ({ ...f, salt: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-input" value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="inv-form-row">
                                <div className="form-group">
                                    <label className="form-label">Selling Price (₹) *</label>
                                    <input className="form-input" type="number" placeholder="30" value={form.price}
                                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">MRP (₹)</label>
                                    <input className="form-input" type="number" placeholder="35" value={form.mrp}
                                        onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} />
                                </div>
                            </div>
                            <div className="inv-form-row">
                                <div className="form-group">
                                    <label className="form-label">Quantity *</label>
                                    <input className="form-input" type="number" placeholder="50" value={form.qty}
                                        onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Low Stock Alert</label>
                                    <input className="form-input" type="number" placeholder="10" value={form.lowStockThreshold}
                                        onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Expiry Date</label>
                                <input className="form-input" type="date" value={form.expiryDate}
                                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                                {loading ? 'Saving...' : editItem ? 'Update Medicine' : 'Add Medicine'}
                            </button>
                        </form>
                    </div>
                </>
            )}

            {/* Bottom Nav */}
            <nav className="pd-bottom-nav">
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-dashboard')}>
                    <TrendingUp size={20} /><span>Dashboard</span>
                </button>
                <button className="pd-nav-item active" onClick={() => navigate('/pharmacy-inventory')}>
                    <Package size={20} /><span>Inventory</span>
                </button>
                <button className="pd-nav-item" onClick={() => navigate('/pharmacy-requests')}>
                    <ClipboardList size={20} /><span>Requests</span>
                </button>
                <button className="pd-nav-item" onClick={doLogout}>
                    <LogOut size={20} /><span>Logout</span>
                </button>
            </nav>
        </div>
    );
}
