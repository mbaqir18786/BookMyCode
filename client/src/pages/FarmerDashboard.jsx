import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import { PlusCircle, Tractor, ShoppingBag, Sparkles, MapPin, Calendar, PhoneCall, MessageSquare, Smartphone, CheckCircle2 } from 'lucide-react';

export default function FarmerDashboard() {
  const { currentUser } = useCurrentUser();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferredChannel, setPreferredChannel] = useState('web_app');
  const [savedChannelMsg, setSavedChannelMsg] = useState('');

  useEffect(() => {
    fetchFarms();
  }, [currentUser.id]);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/farms?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setFarms(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelSelect = (channel) => {
    setPreferredChannel(channel);
    setSavedChannelMsg(`Notification channel saved: ${channel.toUpperCase().replace('_', ' ')}`);
    setTimeout(() => setSavedChannelMsg(''), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Farmer Profile Header Banner */}
      <div className="neo-box p-6 bg-[#DCFCE7] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="neo-badge bg-[#15803D] text-white">FARMER DASHBOARD</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A] mt-1">Sat Sri Akal, {currentUser.name}!</h1>
          <p className="font-semibold text-sm text-gray-700">
            District: <span className="font-bold underline">{currentUser.district}</span> | Phone: {currentUser.phone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/farmer/farms/new" className="neo-btn neo-btn-primary text-sm flex items-center space-x-1">
            <PlusCircle className="w-4 h-4" />
            <span>Add Land Plot</span>
          </Link>
          <Link to="/farmer/machinery" className="neo-btn neo-btn-accent text-sm flex items-center space-x-1">
            <Tractor className="w-4 h-4" />
            <span>Hire Machinery</span>
          </Link>
          <Link to="/farmer/buyers" className="neo-btn bg-white text-black text-sm flex items-center space-x-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Sell Stubble</span>
          </Link>
        </div>
      </div>

      {/* Clean Notification Preference Box for Farmers */}
      <div className="neo-box p-6 bg-white space-y-3 border-4 border-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h3 className="text-xl font-black uppercase flex items-center space-x-2">
            <PhoneCall className="w-5 h-5 text-[#15803D]" />
            <span>How do you want to receive stubble recommendations & alerts?</span>
          </h3>
        </div>

        {savedChannelMsg && (
          <div className="p-3 bg-green-100 border-2 border-green-800 text-xs font-black text-green-900 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
            <span>{savedChannelMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <button
            onClick={() => handleChannelSelect('web_app')}
            className={`neo-box p-4 text-left transition-colors space-y-1 ${
              preferredChannel === 'web_app' ? 'bg-[#DCFCE7] border-4 border-[#15803D]' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between font-black">
              <span className="flex items-center space-x-1"><Smartphone className="w-4 h-4" /> <span>Web App</span></span>
              {preferredChannel === 'web_app' && <span className="neo-badge bg-[#15803D] text-white text-[10px]">SELECTED</span>}
            </div>
            <p className="text-[11px] text-gray-600 font-semibold">View recommendations on this web dashboard.</p>
          </button>

          <button
            onClick={() => handleChannelSelect('voice_call')}
            className={`neo-box p-4 text-left transition-colors space-y-1 ${
              preferredChannel === 'voice_call' ? 'bg-purple-100 border-4 border-purple-800' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between font-black">
              <span className="flex items-center space-x-1"><PhoneCall className="w-4 h-4 text-purple-700" /> <span>Phone Call</span></span>
              {preferredChannel === 'voice_call' && <span className="neo-badge bg-purple-700 text-white text-[10px]">SELECTED</span>}
            </div>
            <p className="text-[11px] text-gray-600 font-semibold">Receive an automated phone call in Punjabi.</p>
          </button>

          <button
            onClick={() => handleChannelSelect('whatsapp')}
            className={`neo-box p-4 text-left transition-colors space-y-1 ${
              preferredChannel === 'whatsapp' ? 'bg-green-100 border-4 border-green-800' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between font-black">
              <span className="flex items-center space-x-1"><MessageSquare className="w-4 h-4 text-green-700" /> <span>WhatsApp Message</span></span>
              {preferredChannel === 'whatsapp' && <span className="neo-badge bg-green-700 text-white text-[10px]">SELECTED</span>}
            </div>
            <p className="text-[11px] text-gray-600 font-semibold">Receive recommendations via WhatsApp.</p>
          </button>
        </div>
      </div>

      {/* Farms Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-4 border-black pb-2">
          <h2 className="text-2xl font-black uppercase">My Registered Land Plots ({farms.length})</h2>
          <Link to="/farmer/farms/new" className="neo-btn bg-yellow-300 text-black text-xs">
            + New Farm
          </Link>
        </div>

        {loading ? (
          <div className="neo-box p-8 text-center space-y-2 animate-pulse bg-gray-100">
            <div className="h-6 bg-gray-300 w-1/3 mx-auto"></div>
            <div className="h-4 bg-gray-200 w-1/2 mx-auto"></div>
          </div>
        ) : farms.length === 0 ? (
          <div className="neo-empty-state space-y-4">
            <h3 className="text-xl font-black uppercase">No Land Plots Registered Yet</h3>
            <p className="font-semibold text-sm text-gray-700 max-w-md mx-auto">
              You haven't added any land plots to your profile yet. Add your paddy field to receive real-time machinery and biomass buyer recommendations.
            </p>
            <Link to="/farmer/farms/new" className="neo-btn neo-btn-primary text-sm inline-flex items-center space-x-2">
              <PlusCircle className="w-4 h-4" />
              <span>Register First Plot</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {farms.map((f) => (
              <div key={f.id} className="neo-box p-6 bg-white flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="neo-badge bg-green-200">{f.crop_type}</span>
                    <span className="font-black text-lg text-[#15803D]">{f.area_acres} Acres</span>
                  </div>

                  <h3 className="text-2xl font-black uppercase text-[#0F172A]">{f.name}</h3>

                  <div className="text-xs font-semibold text-gray-700 space-y-1">
                    <p className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>{f.address}</span>
                    </p>
                    <p className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>Harvest: <strong className="text-red-700">{f.harvest_date}</strong> | Next Sowing: <strong className="text-green-700">{f.next_sowing_date}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t-2 border-black flex flex-wrap gap-2">
                  <Link
                    to={`/farmer/farms/${f.id}/recommendation`}
                    className="neo-btn neo-btn-accent text-xs flex-1 text-center py-2 flex items-center justify-center space-x-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Get AI Recommendation</span>
                  </Link>

                  <Link
                    to={`/farmer/farms/${f.id}`}
                    className="neo-btn bg-white text-black text-xs py-2"
                  >
                    Details & Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
