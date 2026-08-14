import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Tractor, Flame, DollarSign, PhoneCall, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="neo-box bg-[#EAB308] p-8 md:p-12 relative overflow-hidden">
        <div className="max-w-4xl space-y-6 relative z-10">
          <span className="neo-badge bg-[#15803D] text-white text-sm">NORTH INDIA STUBBLE PREVENTION PLATFORM</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#0F172A] uppercase leading-tight">
            DON'T BURN STUBBLE. <br />
            <span className="bg-white px-2 border-4 border-[#0F172A]">SELL IT OR CLEAR IT.</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-[#0F172A] max-w-2xl bg-white/80 p-4 border-2 border-black">
            Connecting paddy farmers across Punjab & Haryana to verified machinery rentals (Super Seeders, Happy Seeders) and biofuel buyers <span className="underline">before</span> harvest deadlines hit.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/farmer" className="neo-btn neo-btn-primary text-base py-3.5 px-6">
              🌾 Farmer Portal
            </Link>
            <Link to="/seller" className="neo-btn bg-white text-black text-base py-3.5 px-6">
              🚜 Equipment & Biofuel Buyer Portal
            </Link>
            <Link to="/admin" className="neo-btn neo-btn-danger text-base py-3.5 px-6">
              🏛️ District Government Incident Hub
            </Link>
          </div>
        </div>
      </section>

      {/* Problem & Solution Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-box p-6 bg-white space-y-4">
          <div className="w-12 h-12 bg-red-100 border-2 border-black flex items-center justify-center font-black text-[#C2410C]">
            <Flame className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black uppercase">1. Narrow Sowing Window</h3>
          <p className="font-semibold text-sm text-gray-700">
            Farmers face a strict 2-3 week deadline between paddy harvest and wheat sowing. Hiring equipment is scarce and expensive during peak demand.
          </p>
        </div>

        <div className="neo-box p-6 bg-white space-y-4">
          <div className="w-12 h-12 bg-green-100 border-2 border-black flex items-center justify-center font-black text-[#15803D]">
            <DollarSign className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black uppercase">2. Monetize Residue</h3>
          <p className="font-semibold text-sm text-gray-700">
            Biomass pellet plants, ethanol refineries, and thermal power units actively purchase paddy straw. We match farmers directly with buyers.
          </p>
        </div>

        <div className="neo-box p-6 bg-white space-y-4">
          <div className="w-12 h-12 bg-yellow-100 border-2 border-black flex items-center justify-center font-black text-[#EAB308]">
            <Zap className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black uppercase">3. Real-Time Recommendation</h3>
          <p className="font-semibold text-sm text-gray-700">
            Our recommendation algorithm computes distance, machinery capacity, and buyer prices to present farmers with their single best financial strategy.
          </p>
        </div>
      </section>

      {/* Role Navigation Tiles */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight border-b-4 border-black pb-2">
          Select Your Role Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/farmer" className="neo-box p-6 bg-[#DCFCE7] hover:bg-green-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="neo-badge bg-[#15803D] text-white">ROLE 1</span>
              <h3 className="text-2xl font-black">FARMER PORTAL</h3>
              <p className="text-xs font-semibold text-gray-800">
                Register land plots, calculate harvest timelines, view machinery vs. buyer recommendations, and book equipment.
              </p>
            </div>
            <div className="flex items-center text-sm font-black text-[#15803D]">
              <span>Enter Portal</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link to="/seller" className="neo-box p-6 bg-[#FEF08A] hover:bg-yellow-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="neo-badge bg-[#EAB308] text-black">ROLE 2</span>
              <h3 className="text-2xl font-black">SELLER MARKETPLACE</h3>
              <p className="text-xs font-semibold text-gray-800">
                List Super Seeders/Balers or post residue purchase offers. Submit KYC verification documents to gain live status.
              </p>
            </div>
            <div className="flex items-center text-sm font-black text-[#EAB308]">
              <span>Manage Listings</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link to="/admin" className="neo-box p-6 bg-[#FFEDD5] hover:bg-orange-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="neo-badge bg-[#C2410C] text-white">ROLE 3</span>
              <h3 className="text-2xl font-black">GOVERNMENT DAO</h3>
              <p className="text-xs font-semibold text-gray-800">
                Track satellite fire hotspots (VIIRS/MODIS), review repeat offender history, check nearby resource gaps, and log officer actions.
              </p>
            </div>
            <div className="flex items-center text-sm font-black text-[#C2410C]">
              <span>Incident Map</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link to="/superadmin" className="neo-box p-6 bg-[#E0F2FE] hover:bg-sky-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="neo-badge bg-[#0284C7] text-white">ROLE 4</span>
              <h3 className="text-2xl font-black">SUPER ADMIN</h3>
              <p className="text-xs font-semibold text-gray-800">
                Review pending seller KYC applications, approve/reject submissions with live DB state impact, and audit platform activities.
              </p>
            </div>
            <div className="flex items-center text-sm font-black text-[#0284C7]">
              <span>KYC Queue</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
