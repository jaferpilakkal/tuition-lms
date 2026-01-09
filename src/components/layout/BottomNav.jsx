import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Calendar, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

function BottomNav() {
    const { profile } = useAuth();

    if (!profile) return null;

    const getNavItems = (role) => {
        switch (role) {
            case 'admin':
                return [
                    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/admin/classes', icon: BookOpen, label: 'Classes' },
                    { to: '/admin/users', icon: Users, label: 'Users' },
                ];
            case 'teacher':
                return [
                    { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/teacher/sessions', icon: Calendar, label: 'Sessions' },
                    { to: '/teacher/tasks', icon: ClipboardList, label: 'Tasks' },
                ];
            case 'student':
                return [
                    { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/student/tasks', icon: ClipboardList, label: 'Tasks' },
                    { to: '/student/attendance', icon: Calendar, label: 'Attendance' },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems(profile.role);

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === `/${profile.role}`}
                    className={({ isActive }) =>
                        `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`
                    }
                >
                    <item.icon size={24} className="bottom-nav-icon" />
                    <span className="bottom-nav-label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export default BottomNav;
