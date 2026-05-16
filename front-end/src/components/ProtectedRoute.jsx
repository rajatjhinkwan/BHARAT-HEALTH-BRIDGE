import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.map(r => r.toUpperCase()).includes(user.role.toUpperCase())) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
