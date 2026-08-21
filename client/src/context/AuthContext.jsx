import React, { createContext, useContext, useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000';
const AuthContext = createContext(null);

async function request(path, options = {}) {
  const token = localStorage.getItem('bmc_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function getDashboardPath(role) {
  return {
    farmer: '/farmer',
    seller: '/seller',
    government: '/admin',
    super_admin: '/superadmin'
  }[role] || '/';
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const clearSession = () => {
    localStorage.removeItem('bmc_token');
    setCurrentUser(null);
    setNotifications([]);
  };

  const loadNotifications = async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/notifications?user_id=${encodeURIComponent(userId)}`);
      if (response.ok) setNotifications(await response.json());
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('bmc_token');
    if (!token) {
      setLoading(false);
      return;
    }

    request('/api/auth/me')
      .then(({ user }) => {
        setCurrentUser(user);
        return loadNotifications(user.id);
      })
      .catch(clearSession)
      .finally(() => setLoading(false));
  }, []);

  const establishSession = async ({ token, user }) => {
    localStorage.setItem('bmc_token', token);
    setCurrentUser(user);
    await loadNotifications(user.id);
    return user;
  };

  const login = async (identifier, password) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    return establishSession(data);
  };

  const completeSignup = async (signupData) => {
    const data = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData)
    });
    return establishSession(data);
  };

  const logout = () => clearSession();

  const role = currentUser?.role || null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      user: currentUser,
      role,
      loading,
      isAuthenticated: Boolean(currentUser),
      login,
      completeSignup,
      logout,
      notifications,
      fetchNotifications: () => loadNotifications(currentUser?.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export const useCurrentUser = useAuth;
export { request as authRequest };