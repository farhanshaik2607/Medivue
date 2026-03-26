import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, MapPin, Heart, FileText, Shield, Bell, Users, Pill, AlertTriangle, Clock, Gift, LogOut, Settings, HelpCircle, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { medicines } from '../data/medicines';
import './HealthProfile.css';

export default function HealthProfile() {
    const { state, handleLogout, dispatch } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // On mobile this controls view. On desktop, overview just means no specific tab selected if we want, but let's default to family on desktop or just keep overview as empty state.
    const user = state.user;

    const [showFamilyForm, setShowFamilyForm] = useState(false);
    const [newFamily, setNewFamily] = useState({ name: '', relation: '', age: '' });

    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: 'Home', addressDetails: '', addressLine: '', city: '', pin: '' });

    if (!state.isLoggedIn) {
        return (
            <div className="page-plain hp-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--sp-6)', minHeight: '80vh' }}>
                <div style={{ background: 'var(--primary-100)', color: 'var(--primary)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--sp-4)' }}>
                    <User size={32} />
                </div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Create an Account</h2>
                <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--sp-6)', maxWidth: 300, lineHeight: 1.5 }}>
                    Sign up or log in to view your health profile, saved medicines, and manage your family members.
                </p>
                <button 
                    className="btn btn-primary btn-lg" 
                    onClick={() => {
                        if (handleLogout) {
                            handleLogout().then(() => {
                                navigate('/splash?role=user');
                            });
                        } else {
                            navigate('/splash?role=user');
                        }
                    }}
                    style={{ minWidth: 200 }}
                >
                    Sign Up / Log In
                </button>
            </div>
        );
    }

    const menuItems = [
        { id: 'family', icon: <Users size={18} />, label: 'Family Members', count: user.familyMembers.length, color: '#3B82F6' },
        { id: 'saved', icon: <Heart size={18} />, label: 'Saved Medicines', count: user.savedMedicines.length, color: '#EF4444' },
        { id: 'docs', icon: <FileText size={18} />, label: 'Health Documents', count: user.healthDocuments.length, color: '#22C55E' },
        { id: 'addresses', icon: <MapPin size={18} />, label: 'Saved Addresses', count: user.addresses.length, color: '#F59E0B' },
        { id: 'reminders', icon: <Bell size={18} />, label: 'Reminders & Alerts', color: '#8B5CF6' },
        { id: 'offers', icon: <Gift size={18} />, label: 'Refer & Earn', action: () => navigate('/offers'), color: '#EC4899' },
        { id: 'settings', icon: <Settings size={18} />, label: 'Settings', color: '#64748B' },
        { id: 'help', icon: <HelpCircle size={18} />, label: 'Help & Support', color: '#06B6D4' },
    ];

    const handleMenuClick = (item) => {
        if (item.action) item.action();
        else setActiveTab(item.id);
    };

    return (
        <div className="page-plain hp-page">
            <div className="hp-header desktop-hidden" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', background: 'var(--primary)', color: 'white' }}>
                {activeTab !== 'overview' ? (
                    <button onClick={() => setActiveTab('overview')} style={{ color: 'white' }}><ArrowLeft size={20} /></button>
                ) : (
                    <span style={{ width: 20 }}></span> /* spacer */
                )}
                <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>My Profile</h1>
            </div>

            <div className="desktop-layout" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0', background: 'var(--white)' }}>
                {/* Sidebar Menu */}
                <div className={`desktop-sidebar hp-sidebar ${activeTab !== 'overview' ? 'mobile-hidden' : ''}`}>
                    <div className="hp-hero">
                        <div className="hp-avatar">{user.name.charAt(0)}</div>
                        <h2 className="hp-name">{user.name}</h2>
                        <p className="hp-email">{user.email}</p>
                    </div>

                    <div className="hp-menu animate-fade-in">
                        {menuItems.map(item => (
                            <button key={item.id} className={`hp-menu-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => handleMenuClick(item)}>
                                <div className="hp-menu-icon" style={{ background: item.color + '15', color: item.color }}>{item.icon}</div>
                                <span className="hp-menu-label">{item.label}</span>
                                <div className="hp-menu-right">
                                    {item.count !== undefined && <span className="hp-menu-count">{item.count}</span>}
                                    <ChevronRight size={16} color="var(--gray-400)" className="mobile-only" />
                                </div>
                            </button>
                        ))}
                        <button
                            className="hp-menu-item hp-logout"
                            onClick={async () => {
                                if (handleLogout) {
                                    await handleLogout();
                                    navigate('/'); // This will trigger the splash screen since isLoggedIn becomes false
                                }
                            }}
                        >
                            <div className="hp-menu-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}><LogOut size={18} /></div>
                            <span className="hp-menu-label" style={{ color: '#EF4444' }}>Log Out</span>
                            <ChevronRight size={16} color="var(--gray-300)" className="mobile-only" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`desktop-main hp-main ${activeTab === 'overview' ? 'desktop-empty-state mobile-hidden' : ''}`} style={{ minHeight: '500px' }}>

                    {activeTab === 'overview' && (
                        <div className="desktop-only empty-state" style={{ height: '100%', marginTop: '100px' }}>
                            <User size={64} color="var(--gray-300)" />
                            <h3>Select an option from the menu</h3>
                            <p>Manage your health profile, documents, and settings.</p>
                        </div>
                    )}

                    {activeTab === 'family' && (
                        <div className="hp-section animate-slide-up">
                            <button className="hp-back-btn desktop-hidden" onClick={() => setActiveTab('overview')}>← Back</button>
                            <h3 className="hp-section-title"><Users size={16} /> Family Members</h3>
                            <div className="hp-family-list">
                                {user.familyMembers.map(fm => (
                                    <div key={fm.id} className="hp-family-card card card-body">
                                        <div className="hp-fm-top">
                                            <div className="hp-fm-avatar">{fm.name.charAt(0)}</div>
                                            <div>
                                                <h4 className="hp-fm-name">{fm.name}</h4>
                                                <p className="hp-fm-meta">{fm.relation}{fm.age ? ` · ${fm.age}y` : ''}</p>
                                            </div>
                                        </div>
                                        {fm.allergies && fm.allergies.length > 0 && (
                                            <div className="hp-fm-allergies">
                                                <AlertTriangle size={12} color="var(--warning)" />
                                                <span>Allergies: {fm.allergies.join(', ')}</span>
                                            </div>
                                        )}
                                        {fm.chronicMeds && fm.chronicMeds.length > 0 && (
                                            <div className="hp-fm-chronic">
                                                <Pill size={12} color="var(--primary)" />
                                                <span>{fm.chronicMeds.length} chronic med{fm.chronicMeds.length > 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {showFamilyForm ? (
                                    <div className="card card-body" style={{ marginTop: '16px' }}>
                                        <h4 style={{ marginBottom: '12px' }}>Add Family Member</h4>
                                        <input autoFocus type="text" placeholder="Name" className="form-input" value={newFamily.name} onChange={e => setNewFamily({...newFamily, name: e.target.value})} style={{ marginBottom: '8px', width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                            <input type="text" placeholder="Relation" className="form-input" value={newFamily.relation} onChange={e => setNewFamily({...newFamily, relation: e.target.value})} style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                                            <input type="number" placeholder="Age" className="form-input" value={newFamily.age} onChange={e => setNewFamily({...newFamily, age: e.target.value})} style={{ width: '80px', boxSizing: 'border-box', padding: '10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                                                if(newFamily.name && newFamily.relation && newFamily.age) {
                                                    dispatch({ type: 'ADD_FAMILY_MEMBER', payload: { id: Date.now().toString(), name: newFamily.name, relation: newFamily.relation, age: newFamily.age } });
                                                    setNewFamily({ name: '', relation: '', age: '' });
                                                    setShowFamilyForm(false);
                                                }
                                            }}>Save</button>
                                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowFamilyForm(false)}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="btn btn-secondary btn-block" style={{ marginTop: '8px' }} onClick={() => setShowFamilyForm(true)}>+ Add Family Member</button>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'saved' && (
                        <div className="hp-section animate-slide-up">
                            <button className="hp-back-btn desktop-hidden" onClick={() => setActiveTab('overview')}>← Back</button>
                            <h3 className="hp-section-title"><Heart size={16} /> Saved Medicines</h3>
                            <div className="hp-saved-list">
                                {user.savedMedicines.map(medId => {
                                    const med = medicines.find(m => m.id === medId);
                                    return med ? (
                                        <div key={med.id} className="hp-saved-item" onClick={() => navigate(`/medicine/${med.id}`)}>
                                            <span className="hp-saved-emoji">{med.image}</span>
                                            <div className="hp-saved-info">
                                                <span className="hp-saved-name">{med.name}</span>
                                                <span className="hp-saved-salt">{med.salt}</span>
                                            </div>
                                            <span className="price">₹{med.mrp}</span>
                                        </div>
                                    ) : null;
                                })}
                                <button className="btn btn-secondary btn-block" style={{ marginTop: '8px' }} onClick={() => navigate('/search')}>+ Add Medicine</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="hp-section animate-slide-up">
                            <button className="hp-back-btn desktop-hidden" onClick={() => setActiveTab('overview')}>← Back</button>
                            <h3 className="hp-section-title"><FileText size={16} /> Health Documents</h3>
                            <div className="hp-docs-list">
                                {user.healthDocuments.map(doc => (
                                    <div key={doc.id} className="hp-doc-card card card-body">
                                        <div className="hp-doc-icon">📄</div>
                                        <div className="hp-doc-info">
                                            <span className="hp-doc-name">{doc.name}</span>
                                            <span className="hp-doc-meta">{doc.type} · {doc.date} · {doc.size}</span>
                                        </div>
                                    </div>
                                ))}
                                <label className="btn btn-secondary btn-block" style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                                    + Upload Document
                                    <input type="file" style={{ display: 'none' }} onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            dispatch({ type: 'ADD_DOCUMENT', payload: { id: Date.now().toString(), name: file.name, type: 'Document', date: new Date().toISOString().split('T')[0], size: (file.size / 1024 / 1024).toFixed(2) + ' MB' } });
                                        }
                                    }} />
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="hp-section animate-slide-up">
                            <button className="hp-back-btn desktop-hidden" onClick={() => setActiveTab('overview')}>← Back</button>
                            <h3 className="hp-section-title"><MapPin size={16} /> Saved Addresses</h3>
                            <div className="hp-addr-list">
                                {user.addresses.map(addr => (
                                    <div key={addr.id} className="hp-addr-card card card-body">
                                        <div className="hp-addr-top">
                                            <span className="co-addr-label">{addr.label}</span>
                                            {addr.isDefault && <span className="badge badge-primary">Default</span>}
                                        </div>
                                        <p className="hp-addr-text">{addr.address}, {addr.city} - {addr.pin}</p>
                                    </div>
                                ))}
                                {showAddressForm ? (
                                    <div className="card card-body" style={{ marginTop: '16px' }}>
                                        <h4 style={{ marginBottom: '12px' }}>Add New Address</h4>
                                        <select value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} style={{ marginBottom: '8px', width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }}>
                                            <option value="Home">Home</option>
                                            <option value="Office">Office</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input type="text" placeholder="House/Flat No, Building Name" value={newAddress.addressDetails} onChange={e => setNewAddress({...newAddress, addressDetails: e.target.value})} style={{ marginBottom: '8px', width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                                        <input type="text" placeholder="Full Address Line & Area" value={newAddress.addressLine} onChange={e => setNewAddress({...newAddress, addressLine: e.target.value})} style={{ marginBottom: '8px', width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                            <input type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                                            <input type="text" placeholder="Pincode" value={newAddress.pin} onChange={e => setNewAddress({...newAddress, pin: e.target.value})} style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                                                if(newAddress.addressLine && newAddress.city && newAddress.pin) {
                                                    dispatch({ type: 'ADD_ADDRESS', payload: { id: Date.now().toString(), label: newAddress.label, address: (newAddress.addressDetails ? newAddress.addressDetails + ', ' : '') + newAddress.addressLine, city: newAddress.city, pin: newAddress.pin, isDefault: user.addresses.length === 0, lat: 12.9716, lng: 77.7500 } });
                                                    setNewAddress({ label: 'Home', addressLine: '', addressDetails: '', city: '', pin: '' });
                                                    setShowAddressForm(false);
                                                }
                                            }}>Save</button>
                                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddressForm(false)}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="btn btn-secondary btn-block" style={{ marginTop: '8px' }} onClick={() => setShowAddressForm(true)}>+ Add Address</button>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reminders' && (
                        <div className="hp-section animate-slide-up">
                            <button className="hp-back-btn desktop-hidden" onClick={() => setActiveTab('overview')}>← Back</button>
                            <h3 className="hp-section-title"><Bell size={16} /> Reminders & Alerts</h3>
                            <div className="hp-reminders-list">
                                {user.reminders.map(rem => (
                                    <div key={rem.id} className="hp-reminder-card card card-body">
                                        <div className="hp-rem-time"><Clock size={16} className="text-primary" /> {rem.time}</div>
                                        <div className="hp-rem-info">
                                            <h4 className="hp-rem-med">{rem.medicine}</h4>
                                            <p className="hp-rem-dosage">{rem.dosage} · <span className="text-xs">{rem.type}</span></p>
                                        </div>
                                    </div>
                                ))}
                                <button className="btn btn-secondary btn-block" style={{ marginTop: '8px' }}>+ Add Reminder</button>
                            </div>
                        </div>
                    )}

                    {/* Pending Settings/Help screens */}
                    {(activeTab === 'settings' || activeTab === 'help') && (
                        <div className="hp-section animate-slide-up">
                            <button className="hp-back-btn desktop-hidden" onClick={() => setActiveTab('overview')}>← Back</button>
                            <h3 className="hp-section-title" style={{ textTransform: 'capitalize' }}>{activeTab}</h3>
                            <div className="empty-state">
                                <h3>Coming Soon</h3>
                                <p>This section is under development.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
