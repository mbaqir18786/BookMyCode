import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, CheckCircle2, AlertTriangle, Tractor, ShoppingBag, DollarSign, Clock } from 'lucide-react';

export default function RecommendationPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendation();
  }, [id]);

  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/farms/${id}/recommendation`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        setError('Failed to calculate recommendation');
      }
    } catch (e) {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto neo-box p-12 text-center bg-yellow-50 space-y-4">
        <Sparkles className="w-10 h-10 text-yellow-600 animate-spin mx-auto" />
        <h2 className="text-2xl font-black uppercase">Analyzing Farm Coordinates & Nearby Listings...</h2>
        <p className="font-bold text-gray-700 text-sm">Evaluating distances, machinery capacity, and buyer prices from database.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto neo-empty-state space-y-3">
        <h2 className="text-xl font-black uppercase text-red-700">Error Generating Recommendation</h2>
        <p className="font-semibold text-sm">{error}</p>
        <Link to="/farmer/farms" className="neo-btn neo-btn-primary text-xs">Back to Farms</Link>
      </div>
    );
  }

  const { farm, daysAvailable, estimated_tons, has_options, primary_recommendation, rationale, nearby_machinery, nearby_buyers } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-3">
        <div className="flex items-center space-x-3">
          <Link to={`/farmer/farms/${farm.id}`} className="neo-btn bg-white text-black p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="neo-badge bg-[#EAB308] text-black">AI RECOMMENDATION ENGINE</span>
            <h1 className="text-3xl font-black uppercase text-[#0F172A]">{farm.name} Strategy</h1>
          </div>
        </div>

        <button onClick={fetchRecommendation} className="neo-btn bg-yellow-300 text-black text-xs font-bold">
          🔄 Re-calculate
        </button>
      </div>

      {/* Farm Context Snapshot */}
      <div className="neo-box p-4 bg-white grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-gray-800">
        <div>
          <span className="text-gray-500 uppercase block">Land Area</span>
          <span className="text-base text-[#15803D]">{farm.area_acres} Acres</span>
        </div>
        <div>
          <span className="text-gray-500 uppercase block">Est. Paddy Straw</span>
          <span className="text-base text-[#0F172A]">{estimated_tons} Tons</span>
        </div>
        <div>
          <span className="text-gray-500 uppercase block">Sowing Window</span>
          <span className="text-base text-blue-700 flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{daysAvailable} Days Left</span>
          </span>
        </div>
        <div>
          <span className="text-gray-500 uppercase block">Farmer Budget</span>
          <span className="text-base text-[#0F172A]">₹{farm.budget_amount ? farm.budget_amount.toLocaleString('en-IN') : 0}</span>
        </div>
      </div>

      {/* Edge Case: No Options Nearby State */}
      {!has_options ? (
        <div className="neo-box p-8 bg-red-100 border-4 border-red-800 space-y-4">
          <div className="flex items-center space-x-3 text-red-900">
            <AlertTriangle className="w-8 h-8 shrink-0 text-red-700" />
            <div>
              <h2 className="text-2xl font-black uppercase">No Options Currently Available Nearby</h2>
              <span className="neo-badge bg-red-700 text-white text-xs">FLAGGED FOR GOVERNMENT ASSISTANCE</span>
            </div>
          </div>

          <p className="font-bold text-sm text-red-950 bg-white/80 p-4 border-2 border-red-800">
            {rationale}
          </p>

          <div className="bg-white p-4 border-2 border-black space-y-2 text-xs font-bold">
            <p className="text-green-800 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-green-700" />
              <span>Your location coordinates ({farm.latitude}, {farm.longitude}) have been logged into the District Agriculture Officer's incident & resource allocation queue.</span>
            </p>
            <p className="text-gray-700">Mobile custom hiring center (CHC) tractors are being prioritized for your village block.</p>
          </div>
        </div>
      ) : (
        /* Primary Recommendation Banner */
        <div className="space-y-6">
          <div className={`neo-box p-8 ${primary_recommendation.action === 'sell_residue' ? 'bg-[#DCFCE7]' : 'bg-[#FEF08A]'} border-4 border-black space-y-4`}>
            <div className="flex items-center justify-between">
              <span className="neo-badge bg-black text-white text-xs">BEST VERIFIED STRATEGY</span>
              <span className="font-extrabold text-sm uppercase underline">{primary_recommendation.action.replace('_', ' ')}</span>
            </div>

            <h2 className="text-3xl font-black uppercase text-[#0F172A] leading-tight">
              {primary_recommendation.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-extrabold bg-white p-4 border-2 border-black">
              <div className="text-green-800">
                <span className="text-xs uppercase text-gray-500 block">Financial Impact</span>
                {primary_recommendation.financial_impact}
              </div>
              <div className="text-blue-800">
                <span className="text-xs uppercase text-gray-500 block">Timeline Impact</span>
                {primary_recommendation.time_impact}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-gray-700">Why This Recommendation?</h4>
              <p className="font-bold text-sm text-gray-900 bg-white/80 p-4 border-2 border-black">
                {rationale}
              </p>
            </div>

            {/* Direct Booking CTA */}
            <div className="pt-2">
              {primary_recommendation.action === 'sell_residue' && primary_recommendation.buyer && (
                <Link
                  to={`/farmer/buyers?buyer_id=${primary_recommendation.buyer.id}`}
                  className="neo-btn neo-btn-primary text-base w-full text-center py-3.5"
                >
                  CONNECT WITH BUYER ({primary_recommendation.buyer.business_name})
                </Link>
              )}

              {primary_recommendation.action === 'rent_machinery' && primary_recommendation.machine && (
                <Link
                  to={`/farmer/machinery?machine_id=${primary_recommendation.machine.id}`}
                  className="neo-btn neo-btn-accent text-base w-full text-center py-3.5"
                >
                  BOOK MACHINE ({primary_recommendation.machine.name})
                </Link>
              )}
            </div>
          </div>

          {/* Available Marketplace Comparison Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nearby Machinery */}
            <div className="neo-box p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <h3 className="text-xl font-black uppercase flex items-center space-x-2">
                  <Tractor className="w-5 h-5 text-[#15803D]" />
                  <span>Nearby Machinery ({nearby_machinery.length})</span>
                </h3>
                <Link to="/farmer/machinery" className="text-xs font-bold underline">View All</Link>
              </div>

              {nearby_machinery.length === 0 ? (
                <p className="text-xs font-semibold text-gray-500 py-4 text-center">No machinery within 50 km</p>
              ) : (
                nearby_machinery.slice(0, 3).map((m) => (
                  <div key={m.id} className="p-3 border-2 border-black bg-gray-50 space-y-1 text-xs font-semibold">
                    <div className="flex justify-between font-bold">
                      <span className="text-sm">{m.name}</span>
                      <span className="text-[#15803D]">₹{m.rate_per_acre}/acre</span>
                    </div>
                    <p className="text-gray-600">{m.business_name} ({m.distance_km} km away)</p>
                    <p className="text-gray-800">Total Est: <strong>₹{m.total_cost.toLocaleString('en-IN')}</strong> ({m.days_required} days)</p>
                  </div>
                ))
              )}
            </div>

            {/* Nearby Buyers */}
            <div className="neo-box p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <h3 className="text-xl font-black uppercase flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-[#EAB308]" />
                  <span>Nearby Buyers ({nearby_buyers.length})</span>
                </h3>
                <Link to="/farmer/buyers" className="text-xs font-bold underline">View All</Link>
              </div>

              {nearby_buyers.length === 0 ? (
                <p className="text-xs font-semibold text-gray-500 py-4 text-center">No buyers within 80 km</p>
              ) : (
                nearby_buyers.slice(0, 3).map((b) => (
                  <div key={b.id} className="p-3 border-2 border-black bg-gray-50 space-y-1 text-xs font-semibold">
                    <div className="flex justify-between font-bold">
                      <span className="text-sm">{b.business_name}</span>
                      <span className="text-yellow-700">₹{b.price_per_ton}/ton</span>
                    </div>
                    <p className="text-gray-600">{b.buying_purpose} ({b.distance_km} km away)</p>
                    <p className="text-gray-800">Est. Revenue: <strong className="text-green-700">+₹{b.gross_revenue.toLocaleString('en-IN')}</strong></p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
