import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ allowedRoles, children }) {
  const { role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <div className="py-16 text-center font-black uppercase">Loading secure portal...</div>;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to default home page for that user's role
    const defaultPaths = {
      farmer: '/farmer',
      seller: '/seller',
      government: '/admin',
      super_admin: '/superadmin'
    };

    const targetRedirect = defaultPaths[role] || '/';

    return <Navigate to={targetRedirect} replace />;
  }

  return children;
}
