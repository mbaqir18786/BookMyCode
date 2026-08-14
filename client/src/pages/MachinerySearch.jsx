import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import { Tractor, MapPin, Calendar, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';

export default function MachinerySearch() {
  const [searchParams] = useSearchParams();
  const { currentUser } = useCurrentUser();

  const [machines, setMachines] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [machineType, setMachineType] = useState('All');
  const [maxDistance, setMaxDistance] = useState('50');

  // Booking Modal
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-10-22');
  const [acresToCover, setAcresToCover] = useState('10');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFarms();
    fetchMachinery();
  }, [machineType, maxDistance]);

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

  const fetchMachinery = async () => {
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/marketplace/machinery?machine_type=${machineType}&max_distance_km=${maxDistance}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMachines(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachine || !selectedFarmId) return;

    try {
      setSubmitting(true);
      const totalPrice = Math.round(Number(acresToCover) * selectedMachine.rate_per_acre);

      const res = await fetch('http://localhost:5000/api/marketplace/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: currentUser.id,
          farm_id: selectedFarmId,
          machine_id: selectedMachine.id,
          booking_date: bookingDate,
          acres: acresToCover,
          total_price: totalPrice
        })
      });

      if (res.ok) {
        setBookingSuccess(true);
        setTimeout(() => {
          setSelectedMachine(null);
          setBookingSuccess(false);
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
          <span className="neo-badge bg-[#15803D] text-white">KYC-APPROVED MARKETPLACE</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A]">Machinery Rental Marketplace</h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="neo-badge bg-green-200 text-green-900 flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Only Verified Sellers Shown</span>
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="neo-box p-4 bg-yellow-100 flex flex-wrap items-center gap-4 text-xs font-bold">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>Filter Machine Type:</span>
          <select
            value={machineType}
            onChange={(e) => setMachineType(e.target.value)}
            className="neo-input text-xs py-1"
          >
            <option value="All">All Machines</option>
            <option value="Super Seeder">Super Seeder</option>
            <option value="Happy Seeder">Happy Seeder</option>
            <option value="Paddy Straw Chopper / Mulcher">Mulcher / Chopper</option>
            <option value="Baler">Baler</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span>Max Radius:</span>
          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
            className="neo-input text-xs py-1"
          >
            <option value="20">Within 20 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
          </select>
        </div>
      </div>

      {/* Machines List */}
      {loading ? (
        <div className="neo-box p-8 text-center bg-gray-100 font-bold">Querying verified equipment providers...</div>
      ) : machines.length === 0 ? (
        <div className="neo-empty-state space-y-3">
          <h3 className="text-xl font-black uppercase">No Machinery Found</h3>
          <p className="font-semibold text-sm text-gray-700">No KYC-approved machinery providers match your radius filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((m) => (
            <div key={m.id} className="neo-box p-6 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="neo-badge bg-green-200 text-green-900">{m.type}</span>
                  <span className="font-black text-[#15803D] text-lg">₹{m.rate_per_acre}/acre</span>
                </div>

                <h3 className="text-2xl font-black uppercase text-[#0F172A]">{m.name}</h3>

                <div className="text-xs font-semibold text-gray-700 space-y-1 bg-gray-50 p-3 border-2 border-black">
                  <p className="font-bold text-gray-900">Owner: {m.business_name}</p>
                  <p className="flex items-center space-x-1 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>{m.address} ({m.distance_km} km away)</span>
                  </p>
                  <p>Daily Capacity: <strong>{m.max_capacity_acres_per_day} Acres/Day</strong></p>
                  <p>KYC Verification: <span className="neo-badge bg-green-700 text-white text-[10px]">APPROVED</span></p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMachine(m)}
                className="neo-btn neo-btn-primary text-sm w-full py-2.5 flex items-center justify-center space-x-2"
              >
                <Tractor className="w-4 h-4" />
                <span>BOOK THIS MACHINE</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="neo-box p-6 bg-white max-w-md w-full space-y-4 shadow-[8px_8px_0px_#0F172A] border-4 border-[#0F172A]">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="text-xl font-black uppercase">Book {selectedMachine.name}</h3>
              <button onClick={() => setSelectedMachine(null)} className="font-bold text-lg">✕</button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 bg-green-100 border-2 border-green-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green-700 mx-auto" />
                <h4 className="font-black text-lg text-green-900">Booking Request Submitted!</h4>
                <p className="text-xs font-bold text-green-800">The machinery provider has been notified via system & SMS.</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Select Your Farm Plot</label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="neo-input text-xs"
                    required
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.area_acres} Acres)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Booking Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="neo-input text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Acres to Clear</label>
                  <input
                    type="number"
                    value={acresToCover}
                    onChange={(e) => setAcresToCover(e.target.value)}
                    className="neo-input text-xs"
                    required
                  />
                </div>

                <div className="p-3 bg-yellow-50 border-2 border-black text-xs font-bold space-y-1">
                  <div className="flex justify-between">
                    <span>Rate / Acre:</span>
                    <span>₹{selectedMachine.rate_per_acre}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-[#15803D] border-t border-black pt-1">
                    <span>Total Estimated Cost:</span>
                    <span>₹{Math.round(Number(acresToCover) * selectedMachine.rate_per_acre).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="neo-btn neo-btn-primary w-full text-sm py-3"
                >
                  {submitting ? 'Submitting...' : 'CONFIRM BOOKING REQUEST'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
