import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../context/CurrentUserContext';
import { PhoneCall, MessageSquare, Play, Send, Bot, CheckCircle2 } from 'lucide-react';

export default function ChannelSimulator() {
  const { currentUser } = useCurrentUser();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('farm_1');

  // IVR Simulator State
  const [phone, setPhone] = useState('+919876543210');
  const [ivrResponse, setIvrResponse] = useState(null);
  const [ivrLoading, setIvrLoading] = useState(false);

  // WhatsApp Simulator State
  const [waMessage, setWaMessage] = useState('RECOMMEND');
  const [waResponse, setWaResponse] = useState(null);
  const [waLoading, setWaLoading] = useState(false);

  useEffect(() => {
    fetchFarms();
  }, [currentUser.id]);

  const fetchFarms = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/farms?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setFarms(data);
        if (data.length > 0) setSelectedFarmId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerIvrCall = async () => {
    try {
      setIvrLoading(true);
      const res = await fetch('http://localhost:5000/api/v1/ivr/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm_id: selectedFarmId, phone })
      });
      if (res.ok) {
        const data = await res.json();
        setIvrResponse(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIvrLoading(false);
    }
  };

  const sendWhatsAppMessage = async () => {
    try {
      setWaLoading(true);
      const res = await fetch('http://localhost:5000/api/v1/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm_id: selectedFarmId, message: waMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setWaResponse(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWaLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="neo-box p-6 bg-purple-200 border-4 border-black flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="neo-badge bg-purple-700 text-white">PHASE 7 MULTI-CHANNEL SIMULATOR</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A] mt-1">Voice (IVR) & WhatsApp Testing</h1>
          <p className="font-semibold text-sm text-gray-800">
            Re-uses exact Phase 3 recommendation backend engine over phone audio & WhatsApp messages!
          </p>
        </div>

        {/* Farm Selector */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase text-purple-950">Select Test Farm Plot:</label>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="neo-input text-xs py-1.5 bg-white w-56"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.area_acres} Acres)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* IVR Phone Call Simulator */}
        <div className="neo-box p-6 bg-white space-y-4 border-4 border-black flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b-2 border-black pb-2">
              <PhoneCall className="w-6 h-6 text-purple-700" />
              <h2 className="text-xl font-black uppercase">IVR Phone Call Simulator</h2>
            </div>

            <p className="text-xs font-semibold text-gray-700">
              Delivers spoken voice recommendations in Punjabi / Hindi for farmers without smartphones.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Farmer Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="neo-input text-xs"
              />
            </div>

            <button
              onClick={triggerIvrCall}
              disabled={ivrLoading}
              className="neo-btn bg-purple-700 text-white text-xs w-full py-3 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{ivrLoading ? 'Simulating Call...' : 'SIMULATE INBOUND IVR CALL'}</span>
            </button>
          </div>

          {ivrResponse && (
            <div className="p-4 bg-purple-50 border-2 border-black space-y-2 text-xs font-bold mt-4">
              <span className="neo-badge bg-purple-800 text-white text-[10px]">VOICE AUDIO TRANSCRIPT</span>
              <p className="text-gray-900 bg-white p-3 border border-black italic">
                "{ivrResponse.voice_script}"
              </p>
            </div>
          )}
        </div>

        {/* WhatsApp Bot Simulator */}
        <div className="neo-box p-6 bg-white space-y-4 border-4 border-black flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b-2 border-black pb-2">
              <MessageSquare className="w-6 h-6 text-green-700" />
              <h2 className="text-xl font-black uppercase">WhatsApp Bot Simulator</h2>
            </div>

            <p className="text-xs font-semibold text-gray-700">
              Sends formatted WhatsApp cards with real buyer offers & seeder booking options.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Incoming Message Command</label>
              <input
                type="text"
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="e.g. RECOMMEND"
                className="neo-input text-xs"
              />
            </div>

            <button
              onClick={sendWhatsAppMessage}
              disabled={waLoading}
              className="neo-btn neo-btn-primary text-xs w-full py-3 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{waLoading ? 'Sending...' : 'SIMULATE WHATSAPP MESSAGE'}</span>
            </button>
          </div>

          {waResponse && (
            <div className="p-4 bg-green-50 border-2 border-black space-y-2 text-xs font-bold mt-4">
              <span className="neo-badge bg-green-800 text-white text-[10px]">WHATSAPP OUTBOUND BOT MESSAGE</span>
              <pre className="text-gray-900 bg-white p-3 border border-black whitespace-pre-wrap font-sans text-xs">
                {waResponse.whatsapp_response}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
