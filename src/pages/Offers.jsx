import { useNavigate } from 'react-router-dom';
import { Tag, Copy, Check, Clock, ChevronRight, Gift, Share2 } from 'lucide-react';
import { useState } from 'react';
import { offers } from '../data/offers';
import './Offers.css';

export default function Offers() {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(null);

    const copyCode = (code) => {
        navigator.clipboard?.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="page offers-page">
            <div className="offers-header">
                <h1 className="heading-md">Offers & Coupons</h1>
            </div>

            {/* Refer section */}
            <div className="refer-card">
                <div className="refer-content">
                    <Gift size={24} color="var(--white)" />
                    <div>
                        <h3 className="refer-title">Refer & Earn ₹100</h3>
                        <p className="refer-sub">Share your referral code with friends</p>
                    </div>
                </div>
                <button className="refer-btn">
                    <Share2 size={14} /> Share
                </button>
            </div>

            {/* Offer cards */}
            <div className="offers-list">
                {offers.map(offer => (
                    <div key={offer.id} className="offer-card card">
                        <div className="offer-banner" style={{ background: offer.bgGradient }}>
                            <div className="offer-banner-content">
                                <h3 className="offer-title">{offer.title}</h3>
                                <p className="offer-subtitle">{offer.subtitle}</p>
                            </div>
                            {offer.isNew && <span className="offer-new-tag">NEW</span>}
                        </div>
                        <div className="offer-body">
                            <p className="offer-desc">{offer.description}</p>
                            <div className="offer-meta">
                                <span className="offer-meta-item"><Tag size={12} /> Min order: ₹{offer.minOrder}</span>
                                <span className="offer-meta-item"><Clock size={12} /> Valid till {offer.validTill}</span>
                            </div>
                            <div className="offer-code-row">
                                <div className="offer-code">
                                    <span>{offer.code}</span>
                                </div>
                                <button className="btn btn-sm btn-primary" onClick={() => copyCode(offer.code)}>
                                    {copied === offer.code ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
