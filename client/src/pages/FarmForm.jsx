import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import { ArrowLeft, Save, MapPin } from 'lucide-react';

export default function FarmForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    crop_type: 'Paddy (Rice)',
    area_acres: '10',
    latitude: '30.9010',
    longitude: '75.8573',
    address: 'Ludhiana, Punjab',
    harvest_date: '2026-10-20',
    next_sowing_date: '2026-11-05',
    budget_amount: '20000'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchFarm();
    }
  }, [id]);

  const fetchFarm = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/farms/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          crop_type: data.crop_type || 'Paddy (Rice)',
          area_acres: String(data.area_acres || 10),
          latitude: String(data.latitude || 30.901),
          longitude: String(data.longitude || 75.8573),
          address: data.address || '',
          harvest_date: data.harvest_date || '',
          next_sowing_date: data.next_sowing_date || '',
          budget_amount: String(data.budget_amount || 20000)
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.area_acres || !formData.harvest_date || !formData.next_sowing_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const url = isEdit ? `http://localhost:5000/api/farms/${id}` : 'http://localhost:5000/api/farms';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: currentUser.id
        })
      });

      if (res.ok) {
        navigate('/farmer/farms');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to save farm plot');
      }
    } catch (e) {
      setError('Network error connecting to API server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-3 border-b-4 border-black pb-3">
        <Link to="/farmer/farms" className="neo-btn bg-white text-black p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="neo-badge bg-[#15803D] text-white">{isEdit ? 'EDIT PLOT' : 'NEW LAND PLOT'}</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A]">
            {isEdit ? 'Update Farm Details' : 'Register New Land Plot'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="neo-box p-4 bg-red-100 border-2 border-red-700 text-red-900 font-bold text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="neo-box p-6 bg-white space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-gray-800">Farm Plot Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ludhiana East Paddy Field"
            className="neo-input"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">Crop Type *</label>
            <select
              value={formData.crop_type}
              onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              className="neo-input"
            >
              <option value="Paddy (Rice)">Paddy (Rice)</option>
              <option value="Basmati Rice">Basmati Rice</option>
              <option value="Coarse Rice">Coarse Rice</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">Total Area (Acres) *</label>
            <input
              type="number"
              step="0.5"
              value={formData.area_acres}
              onChange={(e) => setFormData({ ...formData, area_acres: e.target.value })}
              placeholder="e.g. 12.5"
              className="neo-input"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-gray-800">Village / Tehsil Address *</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Village Jagraon Road, Ludhiana, Punjab"
            className="neo-input"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">GPS Latitude *</label>
            <input
              type="number"
              step="0.0001"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="neo-input"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">GPS Longitude *</label>
            <input
              type="number"
              step="0.0001"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="neo-input"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">Target Harvest Date *</label>
            <input
              type="date"
              value={formData.harvest_date}
              onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
              className="neo-input"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">Next Sowing Deadline *</label>
            <input
              type="date"
              value={formData.next_sowing_date}
              onChange={(e) => setFormData({ ...formData, next_sowing_date: e.target.value })}
              className="neo-input"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-gray-800">Max Machinery Budget (₹) *</label>
          <input
            type="number"
            step="500"
            value={formData.budget_amount}
            onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
            placeholder="e.g. 20000"
            className="neo-input"
            required
          />
        </div>

        <div className="pt-4 border-t-2 border-black flex justify-end space-x-3">
          <Link to="/farmer/farms" className="neo-btn bg-gray-200 text-black text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="neo-btn neo-btn-primary text-sm flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Land Plot'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
