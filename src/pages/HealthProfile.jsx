import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, MapPin, Heart, FileText, Shield, Bell, Users, Pill, AlertTriangle, Clock, Gift, LogOut, Settings, HelpCircle, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { medicines } from '../data/medicines';
import './HealthProfile.css';

export default function HealthProfile() {
    const { state, handleLogout } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // On mobile this controls view. On desktop, overview just means no specific tab selected if we want, but let's default to family on desktop or just keep overview as empty state.
    const user = state.user;

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
                        <p className="hp-phone">{user.phone}</p>
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
                                                <p className="hp-fm-meta">{fm.relation} · {fm.age}y · {fm.gender} · {fm.bloodGroup}</p>
                                            </div>
                                        </div>
                                        {fm.allergies.length > 0 && (
                                            <div className="hp-fm-allergies">
                                                <AlertTriangle size={12} color="var(--warning)" />
                                                <span>Allergies: {fm.allergies.join(', ')}</span>
                                            </div>
                                        )}
                                        {fm.chronicMeds.length > 0 && (
                                            <div className="hp-fm-chronic">
                                                <Pill size={12} color="var(--primary)" />
                                                <span>{fm.chronicMeds.length} chronic med{fm.chronicMeds.length > 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button className="btn btn-secondary btn-block" style={{ marginTop: '8px' }}>+ Add Family Member</button>
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
                                <button className="btn btn-secondary btn-block" style={{ marginTop: '8px' }}>+ Upload Document</button>
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
