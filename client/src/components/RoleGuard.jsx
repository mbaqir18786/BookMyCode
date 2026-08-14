import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import { ShieldAlert } from 'lucide-react';

export default function RoleGuard({ allowedRoles, children }) {
  const { currentUser, role } = useCurrentUser();
  const location = useLocation();

  if (!allowedRoles.includes(role)) {
    // Redirect to default home page for that user's role
    const defaultPaths = {
      farmer: '/farmer',
      seller: '/seller',
      government: '/admin',
      super_admin: '/superadmin'
    };

    const targetRedirect = defaultPaths[role] || '/';

    return (
      <div className="max-w-2xl mx-auto neo-box p-8 bg-red-100 border-4 border-red-800 text-center space-y-4 my-12">
        <ShieldAlert className="w-12 h-12 text-red-700 mx-auto" />
        <h2 className="text-2xl font-black uppercase text-red-900">Access Restricted</h2>
        <p className="font-bold text-sm text-red-950">
          Your current role (<strong className="uppercase underline">{role}</strong>) does not have permission to access <code className="bg-white px-2 py-0.5 border border-black">{location.pathname}</code>.
        </p>
        <p className="text-xs text-gray-700">Use the Dev Role Switcher at the top banner to simulate another role context.</p>
        <Navigate to={targetRedirect} replace />
      </div>
    );
  }

  return children;
}
