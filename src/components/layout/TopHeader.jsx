import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ChevronDown, Bell, Search, ShoppingCart, User, Gift, ClipboardList, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { notifications } from '../../data/offers';
import './TopHeader.css';

export default function TopHeader() {
    const { state, dispatch, getCartCount, fetchLocation } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const unread = notifications.filter(n => !n.read).length;
    const cartCount = getCartCount();

    const toggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });

    const hiddenRoutes = ['/splash', '/checkout'];
    if (hiddenRoutes.some(r => location.pathname.startsWith(r))) return null;

    return (
        <header className="top-header" id="top-header">
            <div className="top-header-inner">
                {/* Mobile Left: Location */}
                <div className="top-header-location mobile-only" onClick={fetchLocation}>
                    <MapPin size={18} className="location-pin" />
                    <div className="location-text">
                        <span className="location-label">Deliver to</span>
                        <span className="location-address">
                            {state.location.address || 'Set location'}
                            <ChevronDown size={14} />
                        </span>
                    </div>
                </div>

                {/* Desktop Left: Logo & Location */}
                <div className="desktop-left desktop-only">
                    <div className="header-logo" onClick={() => navigate('/')}>
                        <span className="logo-icon">💊</span>
                        <span className="logo-text">MediVue+</span>
                    </div>
                    <div className="desktop-location" onClick={fetchLocation} style={{ cursor: 'pointer' }}>
                        <MapPin size={16} color="var(--primary)" />
                        <span className="loc-text">{state.location.city || 'Set Location'}</span>
                        <ChevronDown size={14} color="var(--gray-500)" />
                    </div>
                </div>

                {/* Desktop Center: Search */}
                <div className="desktop-center desktop-only">
                    <div className="header-search" onClick={() => navigate('/search')}>
                        <Search size={18} color="var(--gray-400)" />
                        <input type="text" placeholder="Search for medicines, brands and more..." readOnly />
                        <button className="header-search-btn">Search</button>
                    </div>
                </div>

                {/* Mobile Right: Notifications & Theme */}
                <div className="top-header-actions mobile-only">
                    <button className="header-icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
                        {state.theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                    </button>
                    <button className="header-icon-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
                        <Bell size={22} />
                        {unread > 0 && <span className="notif-badge">{unread}</span>}
                    </button>
                </div>

                {/* Desktop Right: Navigation */}
                <div className="desktop-right desktop-only">
                    <button className="d-nav-item" onClick={toggleTheme}>
                        {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} <span className="d-nav-text">Theme</span>
                    </button>
                    <button className="d-nav-item" onClick={() => navigate('/offers')}>
                        <Gift size={20} /> <span className="d-nav-text">Offers</span>
                    </button>
                    <button className="d-nav-item" onClick={() => navigate('/orders')}>
                        <ClipboardList size={20} /> <span className="d-nav-text">Orders</span>
                    </button>
                    <button className="d-nav-item" onClick={() => navigate('/profile')}>
                        <User size={20} /> <span className="d-nav-text">{state.isLoggedIn ? (state.user?.name?.split(' ')[0] || 'Profile') : 'Login'}</span>
                    </button>
                    <button className="d-nav-item d-cart" onClick={() => navigate('/cart')}>
                        <ShoppingCart size={20} />
                        <span className="d-nav-text">Cart</span>
                        {cartCount > 0 && <span className="d-cart-badge">{cartCount}</span>}
                    </button>
                </div>
            </div>
        </header>
    );
}
