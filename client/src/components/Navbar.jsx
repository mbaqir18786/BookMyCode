import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Menu, X, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { currentUser, role, logout, notifications, fetchNotifications, isAuthenticated } = useAuth();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const roleNavLinks = {
    farmer: [
      { path: '/farmer', label: '🌾 Dashboard' },
      { path: '/farmer/farms', label: '📍 My Plots' },
      { path: '/farmer/machinery', label: '🚜 Rent Machinery' },
      { path: '/farmer/buyers', label: '🛍️ Sell Stubble' }
    ],
    seller: [
      { path: '/seller', label: '🚜 Seller Dashboard' }
    ],
    government: [
      { path: '/admin', label: '🏛️ Fire Hotspots & Map' }
    ],
    super_admin: [
      { path: '/superadmin', label: '⚡ KYC Queue' }
    ]
  };

  const navItems = roleNavLinks[role] || [];

  const roleColors = {
    farmer: 'bg-[#15803D] text-white',
    seller: 'bg-[#EAB308] text-black',
    government: 'bg-[#C2410C] text-white',
    super_admin: 'bg-[#0284C7] text-white',
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-40 bg-[#FAF9F5] border-b-4 border-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-black uppercase">
            CROP RESIDUE <span className="bg-[#EAB308] px-1 border-2 border-[#0F172A]">PORTAL</span>
          </Link>
          <div className="flex gap-2 text-xs font-black uppercase">
            <Link to="/login" className="neo-btn bg-white px-3 py-2">
              Sign in
            </Link>
            <Link to="/signup" className="neo-btn neo-btn-primary px-3 py-2">
              Sign up
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5] border-b-4 border-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link to={navItems[0]?.path || '/'} className="flex items-center gap-2 shrink-0">
          <span className="bg-[#15803D] text-white p-1.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-base">
            🌾
          </span>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-black uppercase">
              CROP RESIDUE <span className="bg-[#EAB308] px-1 border border-[#0F172A]">PORTAL</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#15803D]">
              {role?.toUpperCase()} PORTAL
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 font-bold text-xs flex-1 justify-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-colors whitespace-nowrap ${
                location.pathname === item.path
                  ? 'bg-[#15803D] text-white'
                  : 'bg-white text-[#0F172A] hover:bg-yellow-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="neo-btn bg-yellow-300 p-2 relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-black" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-bold text-[10px] w-4 h-4 rounded-full border border-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 neo-box-static p-4 z-50 bg-white shadow-[6px_6px_0px_#000]">
                <div className="flex items-center justify-between pb-2 border-b-2 border-black mb-3">
                  <h4 className="font-black text-sm uppercase">Notifications</h4>
                  <span className="neo-badge bg-green-200 text-[10px]">{notifications.length} Total</span>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm font-semibold text-gray-500 py-4 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-3 border-2 border-black cursor-pointer transition-colors ${
                          n.is_read
                            ? 'bg-gray-100 opacity-75'
                            : 'bg-yellow-50 font-bold border-l-4 border-l-green-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs uppercase">{n.title}</span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-gray-800">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar + Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 neo-btn bg-white px-2 py-1.5"
              title="My Profile"
            >
              <span
                className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-black border-2 border-[#0F172A] ${
                  roleColors[role] || 'bg-gray-200'
                }`}
              >
                {initials}
              </span>
              <span className="hidden sm:block text-xs font-black uppercase max-w-[80px] truncate">
                {currentUser?.name}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 neo-box-static bg-white z-50 shadow-[6px_6px_0px_#000] overflow-hidden">
                <div className="p-3 border-b-2 border-black bg-gray-50">
                  <p className="font-black text-sm uppercase truncate">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500 font-semibold">{currentUser?.phone}</p>
                  <span className={`neo-badge text-[10px] mt-1 ${roleColors[role] || 'bg-gray-200'}`}>
                    {role?.toUpperCase()}
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 border-2 border-transparent hover:border-red-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden neo-btn bg-white p-2">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-yellow-50 border-t-4 border-black shadow-lg">
          <div className="px-4 py-2 text-[10px] font-black uppercase text-gray-500 border-b border-gray-200">
            Navigation — {role?.toUpperCase()}
          </div>
          <nav className="p-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left font-bold text-sm p-3 border-2 border-black ${
                  location.pathname === item.path ? 'bg-[#15803D] text-white' : 'bg-white text-black'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-3 pb-3">
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full neo-btn bg-red-100 text-red-700 text-sm py-2.5 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
