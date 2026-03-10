import { useNavigate } from 'react-router-dom';
import './RoleSelect.css';

export default function RoleSelect() {
    const navigate = useNavigate();

    return (
        <div className="role-page page-plain">
            <div className="role-bg">
                <div className="role-circle c1"></div>
                <div className="role-circle c2"></div>
                <div className="role-circle c3"></div>
            </div>

            <div className="role-content animate-fade-in">
                <div className="role-logo">
                    <div className="role-logo-icon">💊</div>
                    <h1 className="role-title">Medi<span>Vue+</span></h1>
                    <p className="role-subtitle">Choose how you'd like to continue</p>
                </div>

                <div className="role-cards">
                    <div className="role-card role-card-user" onClick={() => navigate('/splash?role=user')}>
                        <div className="role-card-icon">👤</div>
                        <h2 className="role-card-title">Continue as User</h2>
                        <p className="role-card-desc">Search medicines and request medicines from pharmacies.</p>
                        <div className="role-card-arrow">→</div>
                    </div>

                    <div className="role-card role-card-pharmacy" onClick={() => navigate('/pharmacy-login')}>
                        <div className="role-card-icon">🏥</div>
                        <h2 className="role-card-title">Continue as Pharmacy Owner</h2>
                        <p className="role-card-desc">Manage your pharmacy inventory and respond to medicine requests.</p>
                        <div className="role-card-arrow">→</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
