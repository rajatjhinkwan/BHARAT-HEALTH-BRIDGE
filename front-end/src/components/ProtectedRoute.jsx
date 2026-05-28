import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole, isOversightRole } from '../utils/roles';

export default function ProtectedRoute({ allowedRoles, requiredPermission }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasAnyRole(user.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (
    requiredPermission &&
    !isOversightRole(user.role) &&
    !user.permissions?.[requiredPermission]
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
