import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'college' | 'student')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If allowedRoles is set, we MUST have a profile to verify.
    // If profile is still null (but not loading), it means profile fetch failed or doesn't exist.
    if (allowedRoles) {
        if (!profile) {
            // Profile missing/error case - redirect to home or show error
            return <Navigate to="/home" replace />;
        }
        if (!allowedRoles.includes(profile.role)) {
            return <Navigate to="/home" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
