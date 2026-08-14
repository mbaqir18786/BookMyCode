import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, MapPin, Calendar, Edit3, Trash2, Tractor, ShoppingBag } from 'lucide-react';

export default function FarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarm();
  }, [id]);

  const fetchFarm = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/farms/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFarm(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteFarm = async () => {
    if (!window.confirm('Delete this plot record?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/farms/${id}`, { method: 'DELETE' });
      if (res.ok) navigate('/farmer/farms');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="neo-box p-8 text-center bg-gray-100 font-bold">Loading plot data...</div>;
  }

  if (!farm) {
    return (
      <div className="neo-empty-state space-y-3">
        <h2 className="text-2xl font-black uppercase">Farm Plot Not Found</h2>
        <Link to="/farmer/farms" className="neo-btn neo-btn-primary text-xs">Return to Farms List</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between border-b-4 border-black pb-3">
        <div className="flex items-center space-x-3">
          <Link to="/farmer/farms" className="neo-btn bg-white text-black p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="neo-badge bg-[#15803D] text-white">PLOT DETAILS</span>
            <h1 className="text-3xl font-black uppercase text-[#0F172A]">{farm.name}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={`/farmer/farms/${farm.id}/edit`} className="neo-btn bg-blue-100 text-black text-xs flex items-center space-x-1">
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </Link>
          <button onClick={deleteFarm} className="neo-btn neo-btn-danger text-xs flex items-center space-x-1">
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="neo-box p-6 bg-white space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-yellow-50 p-4 border-2 border-black">
          <div>
            <span className="text-xs font-black uppercase text-gray-600">Crop & Acreage</span>
            <p className="text-2xl font-black text-[#15803D]">{farm.crop_type} - {farm.area_acres} Acres</p>
          </div>
          <div>
            <span className="text-xs font-black uppercase text-gray-600">Max Budget</span>
            <p className="text-2xl font-black text-[#0F172A]">₹{farm.budget_amount ? farm.budget_amount.toLocaleString('en-IN') : 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
          <div className="space-y-1 bg-gray-50 p-3 border-2 border-black">
            <span className="text-xs font-bold text-gray-500 uppercase">Location & Address</span>
            <p className="text-black flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-red-600 shrink-0" />
              <span>{farm.address}</span>
            </p>
            <p className="text-xs text-gray-600 pt-1">Coordinates: {farm.latitude}, {farm.longitude}</p>
          </div>

          <div className="space-y-1 bg-gray-50 p-3 border-2 border-black">
            <span className="text-xs font-bold text-gray-500 uppercase">Harvest & Sowing Schedule</span>
            <p className="text-black flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-green-700 shrink-0" />
              <span>Harvest Date: <strong className="text-red-700">{farm.harvest_date}</strong></span>
            </p>
            <p className="text-black flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-green-700 shrink-0" />
              <span>Next Sowing: <strong className="text-green-700">{farm.next_sowing_date}</strong></span>
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="pt-4 border-t-4 border-black space-y-3">
          <Link
            to={`/farmer/farms/${farm.id}/recommendation`}
            className="neo-btn neo-btn-accent text-base w-full text-center py-3 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-5 h-5 text-black" />
            <span>GENERATE AI RECOMMENDATION FOR THIS PLOT</span>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to={`/farmer/machinery?lat=${farm.latitude}&lng=${farm.longitude}`}
              className="neo-btn neo-btn-primary text-xs text-center py-2 flex items-center justify-center space-x-1"
            >
              <Tractor className="w-4 h-4" />
              <span>Browse Nearby Machinery</span>
            </Link>

            <Link
              to={`/farmer/buyers?lat=${farm.latitude}&lng=${farm.longitude}`}
              className="neo-btn bg-white text-black text-xs text-center py-2 flex items-center justify-center space-x-1"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Residue Buyers</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
