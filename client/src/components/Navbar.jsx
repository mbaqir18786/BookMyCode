import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { currentUser, role, logout, notifications, fetchNotifications, isAuthenticated } = useAuth();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Clean, intuitive role-specific navigation menu items
  const roleNavLinks = {
    farmer: [
      { path: '/farmer', label: '🌾 Farmer Dashboard' },
      { path: '/farmer/farms', label: '📍 My Land Plots' },
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
      { path: '/superadmin', label: '⚡ KYC Verification Queue' }
    ]
  };

  const navItems = roleNavLinks[role] || [];

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-40 bg-[#FAF9F5] border-b-4 border-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-black uppercase">CROP RESIDUE <span className="bg-[#EAB308] px-1 border-2 border-[#0F172A]">PORTAL</span></Link>
          <div className="flex gap-2 text-xs font-black uppercase">
            <Link to="/login" className="neo-btn bg-white px-3 py-2">Sign in</Link>
            <Link to="/signup" className="neo-btn neo-btn-primary px-3 py-2">Sign up</Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5] border-b-4 border-[#0F172A]">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Role Tag */}
        <Link to={navItems[0]?.path || '/'} className="flex items-center space-x-2 text-lg sm:text-xl font-black tracking-tight text-[#0F172A] hover:text-[#15803D]">
          <span className="bg-[#15803D] text-white p-2 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">🌾</span>
          <div className="flex flex-col">
            <span className="uppercase leading-none">CROP RESIDUE <span className="bg-[#EAB308] px-1 border border-[#0F172A]">PORTAL</span></span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#15803D] mt-0.5">
              {role.toUpperCase()} PORTAL
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Items */}
        <nav className="hidden md:flex items-center space-x-2 font-bold text-sm">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] transition-colors ${
                location.pathname === item.path ? 'bg-[#15803D] text-white' : 'bg-white text-[#0F172A] hover:bg-yellow-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions: Notifications & Mobile Menu Toggle */}
        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline text-xs font-black uppercase">{currentUser.name}</span>
          <button onClick={logout} className="neo-btn bg-white px-3 py-2 text-xs">Sign out</button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="neo-btn bg-yellow-300 p-2 relative flex items-center space-x-1"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-black" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white font-bold text-xs w-5 h-5 rounded-full border-2 border-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 neo-box-static p-4 z-50 bg-white shadow-[6px_6px_0px_#000]">
                <div className="flex items-center justify-between pb-2 border-b-2 border-black mb-3">
                  <h4 className="font-black text-base uppercase">System Notifications</h4>
                  <span className="neo-badge bg-green-200">{notifications.length} Total</span>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm font-semibold text-gray-500 py-4 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-3 border-2 border-black cursor-pointer transition-colors ${
                          n.is_read ? 'bg-gray-100 opacity-75' : 'bg-yellow-50 font-bold border-l-8 border-l-green-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs uppercase">{n.title}</span>
                          <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs mt-1 text-gray-800">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden neo-btn bg-white p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6 text-black" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-yellow-50 border-t-4 border-black p-4 space-y-3 shadow-lg">
          <div className="text-xs font-black uppercase text-gray-700 pb-1 border-b border-black">
            Navigation Menu ({role.toUpperCase()})
          </div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block w-full text-left font-extrabold p-3 border-2 border-black ${
                location.pathname === item.path ? 'bg-[#15803D] text-white' : 'bg-white text-black'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
