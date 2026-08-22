import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../context/CurrentUserContext';
import { ShoppingBag, MapPin, DollarSign, ShieldCheck, CheckCircle2, Factory } from 'lucide-react';
import API_BASE_URL from '../config/api';

export default function BuyerSearch() {
  const { currentUser } = useCurrentUser();

  const [buyers, setBuyers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [cropFilter, setCropFilter] = useState('All');
  const [maxDistance, setMaxDistance] = useState('80');
  const [dbCrops, setDbCrops] = useState(['Paddy Straw', 'Basmati Straw', 'Mustard Husk', 'Wheat Straw']);

  // Connection Modal
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [estimatedTons, setEstimatedTons] = useState('18');
  const [offeredPrice, setOfferedPrice] = useState('1650');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFarms();
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchBuyers();
  }, [cropFilter, maxDistance]);

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/options`);
      if (res.ok) {
        const data = await res.json();
        if (data.crops && data.crops.length > 0) {
          setDbCrops(data.crops);
        }
      }
    } catch (e) {
      console.error('Failed to fetch options in BuyerSearch:', e);
    }
  };

  const fetchFarms = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setFarms(data);
        if (data.length > 0) {
          setSelectedFarmId(data[0].id);
          setEstimatedTons(String(Math.round(data[0].area_acres * 1.8)));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/marketplace/buyers?max_distance_km=${maxDistance}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBuyers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBuyer || !selectedFarmId) return;

    try {
      setSubmitting(true);
      const totalVal = Math.round(Number(estimatedTons) * Number(offeredPrice));

      const res = await fetch(`${API_BASE_URL}/api/marketplace/connection-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: currentUser.id,
          farm_id: selectedFarmId,
          buyer_listing_id: selectedBuyer.id,
          estimated_tons: estimatedTons,
          offered_price_per_ton: offeredPrice,
          total_estimated_value: totalVal
        })
      });

      if (res.ok) {
        setRequestSuccess(true);
        setTimeout(() => {
          setSelectedBuyer(null);
          setRequestSuccess(false);
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-black pb-3">
        <div>
          <span className="neo-badge bg-[#EAB308] text-black">KYC-APPROVED MARKETPLACE</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A]">Biomass & Stubble Buyers</h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="neo-badge bg-green-200 text-green-900 flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Only Verified Biofuel / Industrial Buyers</span>
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="neo-box p-4 bg-green-100 flex flex-wrap items-center gap-4 text-xs font-bold">
        <div className="flex items-center space-x-2">
          <span>Crop / Residue Filter:</span>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="neo-input text-xs py-1 w-48"
          >
            <option value="All">All Residues</option>
            {dbCrops.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span>Max Coverage Radius:</span>
          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
            className="neo-input text-xs py-1 w-48"
          >
            <option value="30">Within 30 km</option>
            <option value="80">Within 80 km</option>
            <option value="150">Within 150 km</option>
          </select>
        </div>
      </div>

      {/* Buyer Cards */}
      {loading ? (
        <div className="neo-box p-8 text-center bg-gray-100 font-bold">Fetching verified residue buyers...</div>
      ) : buyers.length === 0 ? (
        <div className="neo-empty-state space-y-3">
          <h3 className="text-xl font-black uppercase">No Buyers Found</h3>
          <p className="font-semibold text-sm text-gray-700">No KYC-approved bio-residue buyers match your distance filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buyers.map((b) => (
            <div key={b.id} className="neo-box p-6 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="neo-badge bg-yellow-200 text-black flex items-center space-x-1">
                    <Factory className="w-3.5 h-3.5" />
                    <span>{b.buying_purpose}</span>
                  </span>
                  <span className="font-black text-[#15803D] text-lg">₹{b.price_per_ton}/ton</span>
                </div>

                <h3 className="text-2xl font-black uppercase text-[#0F172A]">{b.business_name}</h3>

                <div className="text-xs font-semibold text-gray-700 space-y-1 bg-gray-50 p-3 border-2 border-black">
                  <p className="flex items-center space-x-1 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>{b.address} ({b.distance_km} km away)</span>
                  </p>
                  <p>Required Quantity: <strong>{b.required_tons} Tons</strong></p>
                  <p>Quality Standard: <strong>{b.min_quality}</strong></p>
                  <p>KYC Verification: <span className="neo-badge bg-green-700 text-white text-[10px]">APPROVED</span></p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedBuyer(b);
                  setOfferedPrice(String(b.price_per_ton));
                }}
                className="neo-btn neo-btn-accent text-sm w-full py-2.5 flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>SELL STUBBLE TO BUYER</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connection Request Modal */}
      {selectedBuyer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="neo-box p-6 bg-white max-w-md w-full space-y-4 shadow-[8px_8px_0px_#0F172A] border-4 border-[#0F172A]">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="text-xl font-black uppercase">Sell to {selectedBuyer.business_name}</h3>
              <button onClick={() => setSelectedBuyer(null)} className="font-bold text-lg">✕</button>
            </div>

            {requestSuccess ? (
              <div className="p-6 bg-green-100 border-2 border-green-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green-700 mx-auto" />
                <h4 className="font-black text-lg text-green-900">Residue Sale Offer Submitted!</h4>
                <p className="text-xs font-bold text-green-800">The buyer has received your quantity offer.</p>
              </div>
            ) : (
              <form onSubmit={handleConnectionSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Select Your Farm Plot</label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => {
                      setSelectedFarmId(e.target.value);
                      const f = farms.find((farm) => farm.id === e.target.value);
                      if (f) setEstimatedTons(String(Math.round(f.area_acres * 1.8)));
                    }}
                    className="neo-input text-xs"
                    required
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.area_acres} Acres)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Estimated Residue Volume (Tons)</label>
                  <input
                    type="number"
                    value={estimatedTons}
                    onChange={(e) => setEstimatedTons(e.target.value)}
                    className="neo-input text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Offered Price Per Ton (₹)</label>
                  <input
                    type="number"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    className="neo-input text-xs"
                    required
                  />
                </div>

                <div className="p-3 bg-green-50 border-2 border-black text-xs font-bold space-y-1">
                  <div className="flex justify-between text-base font-black text-[#15803D]">
                    <span>Total Estimated Revenue:</span>
                    <span>+₹{Math.round(Number(estimatedTons) * Number(offeredPrice)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="neo-btn neo-btn-accent w-full text-sm py-3"
                >
                  {submitting ? 'Submitting...' : 'SEND SALE OFFER TO BUYER'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
