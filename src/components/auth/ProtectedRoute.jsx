import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common';

function ProtectedRoute({ children, allowedRoles = [] }) {
    const { isAuthenticated, profile, loading } = useAuth();
    const location = useLocation();

    // Show loading while checking auth state
    if (loading) {
        return <LoadingSpinner fullPage text="Loading..." />;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access if roles are specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = profile?.role ? `/${profile.role}` : '/login';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
}

export default ProtectedRoute;
