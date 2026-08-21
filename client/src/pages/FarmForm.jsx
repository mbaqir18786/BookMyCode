import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import { ArrowLeft, Save, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// Punjab & Haryana districts with their approximate center coordinates
const DISTRICTS = {
  Punjab: {
    'Amritsar': [31.634, 74.8723],
    'Bathinda': [30.2110, 74.9455],
    'Faridkot': [30.6748, 74.7581],
    'Fatehgarh Sahib': [30.6479, 76.3878],
    'Fazilka': [30.4019, 74.0258],
    'Ferozepur': [30.9235, 74.6178],
    'Gurdaspur': [32.0378, 75.4063],
    'Hoshiarpur': [31.5143, 75.9115],
    'Jalandhar': [31.3260, 75.5762],
    'Kapurthala': [31.3793, 75.3798],
    'Ludhiana': [30.9010, 75.8573],
    'Mansa': [29.9878, 75.3914],
    'Moga': [30.8175, 75.1728],
    'Mohali (SAS Nagar)': [30.7046, 76.7179],
    'Muktsar': [30.4759, 74.5153],
    'Nawanshahr': [31.1257, 76.1155],
    'Pathankot': [32.2643, 75.6522],
    'Patiala': [30.3398, 76.3869],
    'Rupnagar': [30.9647, 76.5207],
    'Sangrur': [30.2457, 75.8440],
    'Shaheed Bhagat Singh Nagar': [31.1257, 76.1155],
    'Tarn Taran': [31.4514, 74.9278],
  },
  Haryana: {
    'Ambala': [30.3782, 76.7767],
    'Bhiwani': [28.7929, 75.9977],
    'Charkhi Dadri': [28.5921, 76.2693],
    'Faridabad': [28.4089, 77.3178],
    'Fatehabad': [29.5151, 75.4527],
    'Gurugram': [28.4595, 77.0266],
    'Hisar': [29.1492, 75.7217],
    'Jhajjar': [28.6076, 76.6551],
    'Jind': [29.3162, 76.3149],
    'Kaithal': [29.8014, 76.3997],
    'Karnal': [29.6857, 76.9905],
    'Kurukshetra': [29.9695, 76.8783],
    'Mahendragarh': [28.2774, 76.1495],
    'Nuh': [28.1096, 77.0003],
    'Palwal': [28.1445, 77.3260],
    'Panchkula': [30.6942, 76.8606],
    'Panipat': [29.3909, 76.9635],
    'Rewari': [28.1977, 76.6178],
    'Rohtak': [28.8955, 76.6066],
    'Sirsa': [29.5360, 75.0256],
    'Sonipat': [28.9931, 77.0151],
    'Yamunanagar': [30.1290, 77.2674],
  }
};

export default function FarmForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    crop_type: 'Paddy (Rice)',
    area_acres: '',
    latitude: '',
    longitude: '',
    address: '',
    harvest_date: '',
    next_sowing_date: '',
    budget_amount: ''
  });

  const [selectedState, setSelectedState] = useState('Punjab');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | detecting | success | error
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState('Acres');

  useEffect(() => {
    if (isEdit) fetchFarm();
  }, [id]);

  const fetchFarm = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/farms/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          crop_type: data.crop_type || 'Paddy (Rice)',
          area_acres: String(data.area_acres || ''),
          latitude: String(data.latitude || ''),
          longitude: String(data.longitude || ''),
          address: data.address || '',
          harvest_date: data.harvest_date || '',
          next_sowing_date: data.next_sowing_date || '',
          budget_amount: String(data.budget_amount || '')
        });
        if (data.latitude && data.longitude) setLocationStatus('success');
      }
    } catch (e) { console.error(e); }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          address: prev.address || 'Detected Field Location'
        }));
        setLocationStatus('success');
      },
      () => setLocationStatus('error'),
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    if (!district) return;
    const coords = DISTRICTS[selectedState][district];
    if (coords) {
      setFormData(prev => ({
        ...prev,
        latitude: String(coords[0]),
        longitude: String(coords[1]),
        address: prev.address || `${district}, ${selectedState}`
      }));
      setLocationStatus('success');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const calculatedAcres = formData.area_acres || (parseFloat(areaValue) > 0 ? (areaUnit === 'Bigha' ? (parseFloat(areaValue) * 0.6198).toFixed(2) : areaUnit === 'Kanal' ? (parseFloat(areaValue) * 0.125).toFixed(2) : parseFloat(areaValue).toFixed(2)) : '');

    if (!formData.name || !calculatedAcres || !formData.harvest_date || !formData.next_sowing_date) {
      setError('Please fill in all required fields (Name, Area, Dates)');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Please set your farm location — either tap "Detect My Location" or select your district.');
      return;
    }

    try {
      setSubmitting(true);
      const url = isEdit ? `http://localhost:5000/api/farms/${id}` : 'http://localhost:5000/api/farms';
      const method = isEdit ? 'PUT' : 'POST';
      const resolvedAddress = formData.address || (selectedDistrict ? `${selectedDistrict}, ${selectedState}` : 'Farm Plot Location');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          area_acres: calculatedAcres,
          address: resolvedAddress,
          user_id: currentUser?.id || 'usr_farmer_1'
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

  const locationBtn = {
    idle: { label: '📍 Detect My Location', cls: 'bg-[#15803D] text-white hover:bg-[#166534]' },
    detecting: { label: 'Detecting...', cls: 'bg-gray-300 text-gray-600 cursor-not-allowed' },
    success: { label: '✅ Location Set', cls: 'bg-green-100 text-green-800' },
    error: { label: '❌ Failed — try district', cls: 'bg-red-100 text-red-700' },
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

        {/* Plot Name */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-gray-800">Farm Plot Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ludhiana East Field"
            className="neo-input"
            required
          />
        </div>

        {/* Crop + Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">Crop Type *</label>
            <select value={formData.crop_type} onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })} className="neo-input">
              <option value="Paddy (Rice)">Paddy (Rice)</option>
              <option value="Basmati Rice">Basmati Rice</option>
              <option value="Coarse Rice">Coarse Rice</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">Total Area *</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                min="0"
                value={areaValue}
                onChange={(e) => {
                  const raw = e.target.value;
                  setAreaValue(raw);
                  const val = parseFloat(raw) || 0;
                  let acres = val;
                  if (areaUnit === 'Bigha') acres = val * 0.6198;
                  if (areaUnit === 'Kanal') acres = val * 0.125;
                  setFormData(prev => ({ ...prev, area_acres: acres.toFixed(2) }));
                }}
                placeholder="e.g. 5"
                className="neo-input flex-1"
                required
              />
              <select
                value={areaUnit}
                onChange={(e) => {
                  const unit = e.target.value;
                  setAreaUnit(unit);
                  const val = parseFloat(areaValue) || 0;
                  let acres = val;
                  if (unit === 'Bigha') acres = val * 0.6198;
                  if (unit === 'Kanal') acres = val * 0.125;
                  setFormData(prev => ({ ...prev, area_acres: acres.toFixed(2) }));
                }}
                className="neo-input"
                style={{ width: '110px' }}
              >
                <option value="Acres">Acres</option>
                <option value="Bigha">Bigha</option>
                <option value="Kanal">Kanal</option>
              </select>
            </div>
            {areaUnit !== 'Acres' && parseFloat(areaValue) > 0 && (
              <p className="text-xs font-bold text-green-700">= {formData.area_acres} Acres</p>
            )}
          </div>
        </div>

        {/* LOCATION — Smart Section */}
        <div className="space-y-3 p-4 bg-green-50 border-2 border-[#15803D]">
          <p className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#15803D]" /> Farm Location *
          </p>

          {/* Option 1: Auto-detect */}
          <button
            type="button"
            onClick={detectLocation}
            disabled={locationStatus === 'detecting'}
            className={`w-full neo-btn text-sm py-3 font-black flex items-center justify-center gap-2 ${locationBtn[locationStatus].cls}`}
          >
            {locationStatus === 'detecting' && <Loader2 className="w-4 h-4 animate-spin" />}
            {locationBtn[locationStatus].label}
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 border-t border-gray-300" />
            <span className="font-bold">OR SELECT YOUR DISTRICT</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Option 2: District Dropdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600">State</label>
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); }}
                className="neo-input text-sm"
              >
                <option value="Punjab">Punjab</option>
                <option value="Haryana">Haryana</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="neo-input text-sm"
              >
                <option value="">— Select District —</option>
                {Object.keys(DISTRICTS[selectedState]).sort().map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {locationStatus === 'success' && (
            <p className="text-xs font-bold text-green-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Location captured successfully
            </p>
          )}
          {locationStatus === 'error' && (
            <p className="text-xs font-bold text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Could not detect automatically — please select your district above.
            </p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-gray-800">Village / Tehsil Address</label>
          <input
            type="text" value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Village Khanna, Ludhiana, Punjab"
            className="neo-input"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">Target Harvest Date *</label>
            <input
              type="date" value={formData.harvest_date}
              onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
              className="neo-input" required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-800">Next Sowing Deadline *</label>
            <input
              type="date" value={formData.next_sowing_date}
              onChange={(e) => setFormData({ ...formData, next_sowing_date: e.target.value })}
              className="neo-input" required
            />
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-gray-800">Max Machinery Budget (₹) *</label>
          <input
            type="number" step="500" value={formData.budget_amount}
            onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
            placeholder="e.g. 20000" className="neo-input" required
          />
        </div>

        <div className="pt-4 border-t-2 border-black flex justify-end space-x-3">
          <Link to="/farmer/farms" className="neo-btn bg-gray-200 text-black text-sm">Cancel</Link>
          <button
            type="submit" disabled={submitting}
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
