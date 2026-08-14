import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrentUserContext = createContext();

const DEMO_USERS = {
  farmer: {
    id: 'usr_farmer_1',
    role: 'farmer',
    name: 'Gurpreet Singh',
    phone: '+919876543210',
    email: 'gurpreet.farm@example.com',
    district: 'Ludhiana',
    kyc_status: 'approved'
  },
  seller: {
    id: 'usr_seller_1',
    role: 'seller',
    name: 'Kahlon Agricultural Machinery',
    phone: '+919812345678',
    email: 'kahlon.agri@example.com',
    district: 'Ludhiana',
    seller_id: 'seller_1',
    kyc_status: 'approved'
  },
  government: {
    id: 'usr_gov_1',
    role: 'government',
    name: 'Officer Rajesh Kumar (DAO)',
    phone: '+919417000111',
    email: 'dao.ludhiana@punjab.gov.in',
    district: 'Ludhiana',
    kyc_status: 'approved'
  },
  super_admin: {
    id: 'usr_admin_1',
    role: 'super_admin',
    name: 'State Super Admin',
    phone: '+919417000000',
    email: 'superadmin@cropresidue.gov.in',
    district: 'Chandigarh',
    kyc_status: 'approved'
  }
};

export function CurrentUserProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('bmc_role') || 'farmer');
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[role] || DEMO_USERS.farmer);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    localStorage.setItem('bmc_role', role);
    setCurrentUser(DEMO_USERS[role] || DEMO_USERS.farmer);
    fetchNotifications();
  }, [role]);

  const fetchNotifications = async () => {
    try {
      const u = DEMO_USERS[role] || DEMO_USERS.farmer;
      const res = await fetch(`http://localhost:5000/api/notifications?user_id=${u.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const switchRole = (newRole) => {
    if (DEMO_USERS[newRole]) {
      setRole(newRole);
    }
  };

  return (
    <CurrentUserContext.Provider value={{ currentUser, role, switchRole, notifications, fetchNotifications }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
