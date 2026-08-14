import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Lenis from 'lenis';

import { CurrentUserProvider, useCurrentUser } from './context/CurrentUserContext';
import Navbar from './components/Navbar';
import RoleGuard from './components/RoleGuard';
import ChatbotWidget from './components/ChatbotWidget';

import LandingPage from './pages/LandingPage';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmsList from './pages/FarmsList';
import FarmForm from './pages/FarmForm';
import FarmDetail from './pages/FarmDetail';
import RecommendationPage from './pages/RecommendationPage';
import MachinerySearch from './pages/MachinerySearch';
import BuyerSearch from './pages/BuyerSearch';
import SellerDashboard from './pages/SellerDashboard';
import GovDashboard from './pages/GovDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ChannelSimulator from './pages/ChannelSimulator';

function RootRedirect() {
  const { role } = useCurrentUser();
  if (role === 'farmer') return <Navigate to="/farmer" replace />;
  if (role === 'seller') return <Navigate to="/seller" replace />;
  if (role === 'government') return <Navigate to="/admin" replace />;
  if (role === 'super_admin') return <Navigate to="/superadmin" replace />;
  return <LandingPage />;
}

export default function App() {
  // Global Smooth Scroll Integration
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <CurrentUserProvider>
      <Router>
        <div className="min-h-screen bg-[#FAF9F5] text-[#0F172A] flex flex-col font-sans selection:bg-[#EAB308] selection:text-black">
          <Navbar />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-6">
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              {/* Role 1: Farmer Pages */}
              <Route path="/farmer" element={<RoleGuard allowedRoles={['farmer']}><FarmerDashboard /></RoleGuard>} />
              <Route path="/farmer/farms" element={<RoleGuard allowedRoles={['farmer']}><FarmsList /></RoleGuard>} />
              <Route path="/farmer/farms/new" element={<RoleGuard allowedRoles={['farmer']}><FarmForm /></RoleGuard>} />
              <Route path="/farmer/farms/:id" element={<RoleGuard allowedRoles={['farmer']}><FarmDetail /></RoleGuard>} />
              <Route path="/farmer/farms/:id/edit" element={<RoleGuard allowedRoles={['farmer']}><FarmForm /></RoleGuard>} />
              <Route path="/farmer/farms/:id/recommendation" element={<RoleGuard allowedRoles={['farmer']}><RecommendationPage /></RoleGuard>} />
              <Route path="/farmer/machinery" element={<RoleGuard allowedRoles={['farmer']}><MachinerySearch /></RoleGuard>} />
              <Route path="/farmer/buyers" element={<RoleGuard allowedRoles={['farmer']}><BuyerSearch /></RoleGuard>} />
              <Route path="/farmer/ivr-channel" element={<RoleGuard allowedRoles={['farmer']}><ChannelSimulator /></RoleGuard>} />

              {/* Role 2: Seller Pages */}
              <Route path="/seller" element={<RoleGuard allowedRoles={['seller']}><SellerDashboard /></RoleGuard>} />

              {/* Role 3: Government DAO Pages */}
              <Route path="/admin" element={<RoleGuard allowedRoles={['government']}><GovDashboard /></RoleGuard>} />

              {/* Role 4: Super Admin KYC Pages */}
              <Route path="/superadmin" element={<RoleGuard allowedRoles={['super_admin']}><SuperAdminDashboard /></RoleGuard>} />

              <Route path="/dev/ivr-simulator" element={<RoleGuard allowedRoles={['farmer']}><ChannelSimulator /></RoleGuard>} />
            </Routes>
          </main>

          {/* AI Chatbot Persistent Assistant */}
          <ChatbotWidget />

          {/* Footer */}
          <footer className="border-t-4 border-[#0F172A] bg-[#0F172A] text-white py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between text-xs font-mono">
              <div>
                <span className="font-bold text-yellow-400">Integrated Crop Residue Management Platform</span> | Real Database Driven Architecture
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </CurrentUserProvider>
  );
}
