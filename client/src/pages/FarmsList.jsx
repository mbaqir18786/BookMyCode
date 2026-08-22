import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import { PlusCircle, MapPin, Calendar, Trash2, Edit3, Sparkles } from 'lucide-react';
import API_BASE_URL from '../config/api';

export default function FarmsList() {
  const { currentUser } = useCurrentUser();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarms();
  }, [currentUser.id]);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/farms?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setFarms(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteFarm = async (id) => {
    if (!window.confirm('Are you sure you want to remove this farm plot?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFarms();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b-4 border-black pb-3">
        <div>
          <span className="neo-badge bg-[#15803D] text-white">FARM MANAGEMENT</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A]">Registered Land Plots</h1>
        </div>

        <Link to="/farmer/farms/new" className="neo-btn neo-btn-primary text-sm flex items-center space-x-1">
          <PlusCircle className="w-4 h-4" />
          <span>Add New Plot</span>
        </Link>
      </div>

      {loading ? (
        <div className="neo-box p-8 text-center bg-gray-100 font-bold">Loading registered farms...</div>
      ) : farms.length === 0 ? (
        <div className="neo-empty-state space-y-3">
          <h3 className="text-xl font-black uppercase">No Land Plots Found</h3>
          <p className="font-semibold text-sm text-gray-700">Add a land plot to manage paddy harvest schedules and connect with nearby machinery.</p>
          <Link to="/farmer/farms/new" className="neo-btn neo-btn-primary text-xs">
            + Add Plot Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farms.map((f) => (
            <div key={f.id} className="neo-box p-6 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="neo-badge bg-yellow-200">{f.crop_type}</span>
                  <span className="font-black text-[#15803D] text-lg">{f.area_acres} Acres</span>
                </div>

                <h3 className="text-2xl font-black uppercase text-[#0F172A]">{f.name}</h3>

                <div className="text-xs font-semibold text-gray-700 space-y-1.5 bg-gray-50 p-3 border-2 border-black">
                  <p className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>{f.address} (Lat: {f.latitude}, Lng: {f.longitude})</span>
                  </p>
                  <p className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Harvest Date: <strong className="text-red-700">{f.harvest_date}</strong></span>
                  </p>
                  <p className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Next Sowing Deadline: <strong className="text-green-700">{f.next_sowing_date}</strong></span>
                  </p>
                  <p className="font-bold text-xs text-gray-900 pt-1 border-t border-gray-300">
                    Max Machinery Budget: ₹{f.budget_amount ? f.budget_amount.toLocaleString('en-IN') : '0'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-black">
                <Link
                  to={`/farmer/farms/${f.id}/recommendation`}
                  className="neo-btn neo-btn-accent text-xs py-2 flex-1 text-center flex items-center justify-center space-x-1"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Recommendation</span>
                </Link>
                <Link
                  to={`/farmer/farms/${f.id}/edit`}
                  className="neo-btn bg-blue-100 text-black text-xs p-2"
                  title="Edit Plot"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => deleteFarm(f.id)}
                  className="neo-btn neo-btn-danger text-xs p-2"
                  title="Delete Plot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
