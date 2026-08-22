import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, DollarSign, Zap, ArrowRight } from 'lucide-react';

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
            Connecting paddy farmers across Punjab &amp; Haryana to verified machinery rentals (Super Seeders, Happy Seeders) and biofuel buyers <span className="underline">before</span> harvest deadlines hit.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/signup" className="neo-btn neo-btn-primary text-base py-3.5 px-6">
              🌾 I'm a Farmer
            </Link>
            <Link to="/signup?role=seller" className="neo-btn bg-white text-black text-base py-3.5 px-6">
              🚜 I'm an Equipment / Buyer
            </Link>
          </div>
          <p className="text-xs font-bold text-[#0F172A]/70">
            Already registered? <Link to="/login" className="underline font-black">Sign In →</Link>
          </p>
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
            Farmers face a strict 2–3 week deadline between paddy harvest and wheat sowing. Equipment is scarce and expensive during peak demand.
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
            Our recommendation engine computes distance, machinery capacity, and buyer prices to give farmers their single best financial strategy.
          </p>
        </div>
      </section>

      {/* Role Navigation — Only public-facing roles */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight border-b-4 border-black pb-2">
          Who is this for?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/signup?role=farmer" className="neo-box p-6 bg-[#DCFCE7] hover:bg-green-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="neo-badge bg-[#15803D] text-white">FOR FARMERS</span>
              <h3 className="text-2xl font-black">FARMER PORTAL</h3>
              <p className="text-xs font-semibold text-gray-800">
                Register your land plots, get machinery booking recommendations, and connect directly with straw buyers before harvest deadlines.
              </p>
              <ul className="text-xs font-semibold text-gray-700 space-y-1 pt-1">
                <li>✅ Book Super Seeders &amp; Happy Seeders</li>
                <li>✅ Sell crop residue to verified buyers</li>
                <li>✅ AI-powered crop management advice</li>
              </ul>
            </div>
            <div className="flex items-center text-sm font-black text-[#15803D]">
              <span>Register as Farmer</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link to="/signup?role=seller" className="neo-box p-6 bg-[#FEF08A] hover:bg-yellow-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="neo-badge bg-[#EAB308] text-black">FOR EQUIPMENT &amp; BUYERS</span>
              <h3 className="text-2xl font-black">SELLER PORTAL</h3>
              <p className="text-xs font-semibold text-gray-800">
                List your Super Seeders, Balers, or Happy Seeders for rent — or post residue purchase offers to source paddy straw from farmers.
              </p>
              <ul className="text-xs font-semibold text-gray-700 space-y-1 pt-1">
                <li>✅ List machinery with live availability</li>
                <li>✅ Post residue purchase offers</li>
                <li>✅ Get KYC-verified for a trust badge</li>
              </ul>
            </div>
            <div className="flex items-center text-sm font-black text-[#EAB308]">
              <span>Register as Seller</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>

        <p className="text-xs font-semibold text-gray-500 text-center border border-dashed border-gray-300 p-3 bg-gray-50">
          🏛️ Government officials and administrators — please contact your district nodal officer for portal access credentials.
        </p>
      </section>
    </div>
  );
}
