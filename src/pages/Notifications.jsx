import { useState } from 'react';
import { Bell, Package, TrendingDown, Clock, Gift, Check } from 'lucide-react';
import { notifications } from '../data/offers';
import './Notifications.css';

export default function Notifications() {
    const [notifs, setNotifs] = useState(notifications);

    const markRead = (id) => {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifs.filter(n => !n.read).length;

    const typeIcon = {
        order: <Package size={16} />,
        price_drop: <TrendingDown size={16} />,
        refill: <Clock size={16} />,
        stock: <Check size={16} />,
        offer: <Gift size={16} />,
        reminder: <Bell size={16} />,
    };

    const typeColor = {
        order: 'var(--primary)',
        price_drop: 'var(--accent)',
        refill: 'var(--warning)',
        stock: 'var(--success)',
        offer: '#8B5CF6',
        reminder: 'var(--info)',
    };

    return (
        <div className="page notif-page">
            <div className="notif-header">
                <h1 className="heading-md">Notifications</h1>
                {unreadCount > 0 && (
                    <button className="btn btn-sm btn-secondary" onClick={markAllRead}>Mark all read</button>
                )}
            </div>

            <div className="notif-list">
                {notifs.map(n => (
                    <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                        <div className="notif-icon" style={{ background: typeColor[n.type] + '15', color: typeColor[n.type] }}>
                            {n.icon}
                        </div>
                        <div className="notif-content">
                            <h4 className="notif-title">{n.title}</h4>
                            <p className="notif-message">{n.message}</p>
                            <span className="notif-time">{n.time}</span>
                        </div>
                        {!n.read && <div className="notif-dot" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
