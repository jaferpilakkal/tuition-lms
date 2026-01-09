import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getRoleBadge = (role) => {
        const roleLabels = {
            admin: 'Admin',
            teacher: 'Teacher',
            student: 'Student'
        };
        return roleLabels[role] || role;
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-brand">
                    <h1 className="header-title">TuitionHub</h1>
                </div>

                <div className="header-actions">
                    {profile && (
                        <div className="header-user">
                            <span className="header-user-name hide-mobile">
                                {profile.name}
                            </span>
                            <span className="header-role-badge">
                                {getRoleBadge(profile.role)}
                            </span>
                        </div>
                    )}

                    <button
                        className="header-profile-btn"
                        onClick={() => navigate('/profile')}
                        title="Profile"
                    >
                        <User size={20} />
                    </button>

                    <button
                        className="header-logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
