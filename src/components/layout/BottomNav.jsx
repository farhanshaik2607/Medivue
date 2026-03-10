import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, ClipboardList, User, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './BottomNav.css';

export default function BottomNav() {
    const { getCartCount } = useApp();
    const location = useLocation();
    const cartCount = getCartCount();

    const tabs = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/search', icon: Search, label: 'Search' },
        { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
        { to: '/my-requests', icon: Send, label: 'Requests' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    if (['/splash', '/checkout'].includes(location.pathname)) return null;

    return (
        <nav className="bottom-nav mobile-only" id="bottom-nav">
            {tabs.map(tab => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                >
                    <div className="bottom-nav-icon-wrap">
                        <tab.icon size={22} strokeWidth={1.8} />
                        {tab.badge > 0 && <span className="bottom-nav-badge">{tab.badge}</span>}
                    </div>
                    <span className="bottom-nav-label">{tab.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
