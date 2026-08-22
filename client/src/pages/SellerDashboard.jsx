import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../context/CurrentUserContext';
import { Tractor, ShoppingBag, PlusCircle, ShieldCheck, AlertCircle, FileText, CheckCircle2, FileCheck } from 'lucide-react';
import API_BASE_URL from '../config/api';

export default function SellerDashboard() {
  const { currentUser } = useCurrentUser();

  const [sellerProfile, setSellerProfile] = useState(null);
  const [myListings, setMyListings] = useState({ machines: [], buyerListings: [], bookings: [], connectionRequests: [] });
  const [loading, setLoading] = useState(true);

  // Forms toggle
  const [showKycForm, setShowKycForm] = useState(false);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showAddBuyerListing, setShowAddBuyerListing] = useState(false);

  // KYC Form State
  const [kycForm, setKycForm] = useState({
    business_name: '',
    seller_type: 'machinery_provider',
    phone: '',
    address: '',
    kyc_docs_url: 'https://example.com/kyc-docs/verification.pdf'
  });

  // Machine Form State
  const [machineForm, setMachineForm] = useState({
    name: '',
    type: 'Super Seeder',
    rate_per_acre: '1600',
    max_capacity_acres_per_day: '12',
    address: 'Ludhiana, Punjab',
    latitude: '30.9010',
    longitude: '75.8573'
  });

  // Buyer Listing Form State
  const [buyerForm, setBuyerForm] = useState({
    crop_type: 'Paddy Straw',
    buying_purpose: 'Biofuel Plant & Pellets',
    price_per_ton: '1700',
    required_tons: '500',
    min_quality: 'Dry Paddy Straw',
    address: 'Focal Point, Ludhiana',
    latitude: '30.9150',
    longitude: '75.8800'
  });

  useEffect(() => {
    fetchProfile();
    fetchMyListings();
  }, [currentUser.id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sellers/profile?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setSellerProfile(data);
        setKycForm({
          business_name: data.business_name || '',
          seller_type: data.seller_type || 'machinery_provider',
          phone: data.phone || '',
          address: data.address || '',
          aadhar_no: data.aadhar_no || '',
          pan_no: data.pan_no || '',
          gst_no: data.gst_no || '',
          udyam_no: data.udyam_no || '',
          aadhar_doc_url: data.aadhar_doc_url || '',
          pan_doc_url: data.pan_doc_url || '',
          gst_doc_url: data.gst_doc_url || '',
          udyam_doc_url: data.udyam_doc_url || '',
          kyc_docs_url: data.kyc_docs_url || ''
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/sellers/my-listings?seller_id=${sellerProfile?.id || 'seller_1'}`);
      if (res.ok) {
        const data = await res.json();
        setMyListings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/sellers/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...kycForm, user_id: currentUser.id })
      });
      if (res.ok) {
        setShowKycForm(false);
        fetchProfile();
        alert('KYC verification request submitted with Aadhaar, PAN, GST, and Udyam details. It is now awaiting Super Admin verification.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/sellers/machines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...machineForm, seller_id: sellerProfile?.id || 'seller_1' })
      });
      if (res.ok) {
        setShowAddMachine(false);
        fetchMyListings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBuyerListing = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/sellers/buyer-listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buyerForm, seller_id: sellerProfile?.id || 'seller_2' })
      });
      if (res.ok) {
        setShowAddBuyerListing(false);
        fetchMyListings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const kycStatus = sellerProfile?.kyc_status || 'pending';

  return (
    <div className="space-y-8 pb-16">
      {/* Seller Header */}
      <div className="neo-box p-6 bg-[#FEF08A] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="neo-badge bg-[#EAB308] text-black">SELLER MARKETPLACE CONTROL</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A] mt-1">
            {sellerProfile?.business_name || currentUser.name}
          </h1>
          <p className="font-semibold text-sm text-gray-800">
            Role Sub-type: <span className="font-bold underline">{sellerProfile?.seller_type || 'Machinery Provider / Buyer'}</span>
          </p>
        </div>

        {/* KYC Status Badge Banner */}
        <div className="flex items-center space-x-3">
          {kycStatus === 'approved' && (
            <div className="neo-box p-3 bg-green-100 border-2 border-green-800 flex items-center space-x-2 text-xs font-black text-green-900">
              <ShieldCheck className="w-5 h-5 text-green-700" />
              <div>
                <span>KYC VERIFIED & ACTIVE</span>
                <p className="text-[10px] text-green-800 font-normal">Listings are live in farmer searches</p>
              </div>
            </div>
          )}

          {kycStatus === 'pending' && (
            <div className="neo-box p-3 bg-yellow-100 border-2 border-yellow-800 flex items-center space-x-2 text-xs font-black text-yellow-900">
              <AlertCircle className="w-5 h-5 text-yellow-700 animate-pulse" />
              <div>
                <span>KYC PENDING VERIFICATION</span>
                <p className="text-[10px] text-yellow-800 font-normal">Super admin review in progress</p>
              </div>
            </div>
          )}

          {kycStatus === 'rejected' && (
            <div className="neo-box p-3 bg-red-100 border-2 border-red-800 flex items-center space-x-2 text-xs font-black text-red-900">
              <AlertCircle className="w-5 h-5 text-red-700" />
              <div>
                <span>KYC REJECTED</span>
                <p className="text-[10px] text-red-800 font-normal">Re-submit verification documents below</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link to="/seller/verify-kyc" className="neo-btn bg-black text-yellow-400 text-xs font-black flex items-center gap-1.5 shadow-md">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Verification Portal</span>
            </Link>
            <button onClick={() => setShowKycForm(!showKycForm)} className="neo-btn bg-white text-black text-xs">
              {showKycForm ? 'Close Quick Form' : 'Quick Update'}
            </button>
          </div>
        </div>
      </div>

      {/* KYC Form Drawer */}
      {showKycForm && (
        <form onSubmit={handleKycSubmit} className="neo-box p-6 bg-white space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-2">
            <h3 className="text-xl font-black uppercase flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-green-700" />
              <span>Seller/Buyer Business Verification (KYC / KYB)</span>
            </h3>
            <p className="text-xs text-gray-600 font-semibold mt-1">
              Submit your official Aadhaar, PAN, GST, and Udyam credentials for Super Admin verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Business / Trade Name</label>
              <input
                type="text"
                value={kycForm.business_name}
                onChange={(e) => setKycForm({ ...kycForm, business_name: e.target.value })}
                className="neo-input"
                placeholder="e.g., Punjab Agro Machinery Services"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Seller Category</label>
              <select
                value={kycForm.seller_type}
                onChange={(e) => setKycForm({ ...kycForm, seller_type: e.target.value })}
                className="neo-input"
              >
                <option value="machinery_provider">Machinery Provider (Rents Equipment)</option>
                <option value="residue_buyer">Residue Buyer (Purchases Paddy Straw)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Contact Phone Number</label>
              <input
                type="text"
                value={kycForm.phone}
                onChange={(e) => setKycForm({ ...kycForm, phone: e.target.value })}
                className="neo-input"
                placeholder="e.g., 9876543210"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Registered Business Address</label>
              <input
                type="text"
                value={kycForm.address}
                onChange={(e) => setKycForm({ ...kycForm, address: e.target.value })}
                className="neo-input"
                placeholder="District, City, Punjab"
                required
              />
            </div>
          </div>

          {/* 4 Required Documents: Aadhaar, PAN, GST, Udyam */}
          <div className="border-2 border-black p-4 bg-yellow-50 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-black border-b-2 border-black pb-1">
              Official Identification & Business Documents
            </h4>

            {/* 1. Aadhaar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 border border-black">
              <div>
                <label className="text-xs font-bold uppercase text-gray-800">1. Aadhaar Card Number</label>
                <input
                  type="text"
                  value={kycForm.aadhar_no}
                  onChange={(e) => setKycForm({ ...kycForm, aadhar_no: e.target.value })}
                  placeholder="12-digit Aadhaar Number"
                  className="neo-input mt-1 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-800">Aadhaar Document URL / File</label>
                <input
                  type="url"
                  value={kycForm.aadhar_doc_url}
                  onChange={(e) => setKycForm({ ...kycForm, aadhar_doc_url: e.target.value })}
                  placeholder="https://.../aadhar.pdf or image URL"
                  className="neo-input mt-1 text-xs"
                  required
                />
              </div>
            </div>

            {/* 2. PAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 border border-black">
              <div>
                <label className="text-xs font-bold uppercase text-gray-800">2. Business / Personal PAN</label>
                <input
                  type="text"
                  value={kycForm.pan_no}
                  onChange={(e) => setKycForm({ ...kycForm, pan_no: e.target.value.toUpperCase() })}
                  placeholder="e.g., ABCDE1234F"
                  maxLength={10}
                  className="neo-input mt-1 text-xs font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-800">PAN Card Document URL / File</label>
                <input
                  type="url"
                  value={kycForm.pan_doc_url}
                  onChange={(e) => setKycForm({ ...kycForm, pan_doc_url: e.target.value })}
                  placeholder="https://.../pan-card.pdf or image URL"
                  className="neo-input mt-1 text-xs"
                  required
                />
              </div>
            </div>

            {/* 3. GST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 border border-black">
              <div>
                <label className="text-xs font-bold uppercase text-gray-800">3. GSTIN Registration Number</label>
                <input
                  type="text"
                  value={kycForm.gst_no}
                  onChange={(e) => setKycForm({ ...kycForm, gst_no: e.target.value.toUpperCase() })}
                  placeholder="e.g., 03AAAAA0000A1Z5"
                  maxLength={15}
                  className="neo-input mt-1 text-xs font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-800">GST Certificate Document URL</label>
                <input
                  type="url"
                  value={kycForm.gst_doc_url}
                  onChange={(e) => setKycForm({ ...kycForm, gst_doc_url: e.target.value })}
                  placeholder="https://.../gst-certificate.pdf"
                  className="neo-input mt-1 text-xs"
                  required
                />
              </div>
            </div>

            {/* 4. Udyam */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 border border-black">
              <div>
                <label className="text-xs font-bold uppercase text-gray-800">4. Udyam Registration Number</label>
                <input
                  type="text"
                  value={kycForm.udyam_no}
                  onChange={(e) => setKycForm({ ...kycForm, udyam_no: e.target.value.toUpperCase() })}
                  placeholder="e.g., UDYAM-PB-00-0000000"
                  className="neo-input mt-1 text-xs font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-800">Udyam Certificate Document URL</label>
                <input
                  type="url"
                  value={kycForm.udyam_doc_url}
                  onChange={(e) => setKycForm({ ...kycForm, udyam_doc_url: e.target.value })}
                  placeholder="https://.../udyam-cert.pdf"
                  className="neo-input mt-1 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="neo-btn neo-btn-primary text-sm w-full py-3">
            SUBMIT 4-DOCUMENT KYC TO SUPER ADMIN QUEUE
          </button>
        </form>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowAddMachine(!showAddMachine)}
          className="neo-btn neo-btn-primary text-sm flex items-center space-x-2"
        >
          <Tractor className="w-4 h-4" />
          <span>+ Add Equipment Listing</span>
        </button>

        <button
          onClick={() => setShowAddBuyerListing(!showAddBuyerListing)}
          className="neo-btn neo-btn-accent text-sm flex items-center space-x-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>+ Add Biomass Buyer Offer</span>
        </button>
      </div>

      {/* Add Machine Form */}
      {showAddMachine && (
        <form onSubmit={handleAddMachine} className="neo-box p-6 bg-white space-y-4 max-w-xl border-4 border-black">
          <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Add Machinery Listing</h3>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase">Equipment Name</label>
            <input
              type="text"
              value={machineForm.name}
              onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
              placeholder="e.g. Super Seeder Turbo 3000"
              className="neo-input"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Machine Type</label>
              <select
                value={machineForm.type}
                onChange={(e) => setMachineForm({ ...machineForm, type: e.target.value })}
                className="neo-input"
              >
                <option value="Super Seeder">Super Seeder</option>
                <option value="Happy Seeder">Happy Seeder</option>
                <option value="Paddy Straw Chopper / Mulcher">Paddy Straw Chopper / Mulcher</option>
                <option value="Baler">Baler</option>
                <option value="Rotavator">Rotavator</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Rate / Acre (₹)</label>
              <input
                type="number"
                value={machineForm.rate_per_acre}
                onChange={(e) => setMachineForm({ ...machineForm, rate_per_acre: e.target.value })}
                className="neo-input"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase">Max Acres Capacity / Day</label>
            <input
              type="number"
              value={machineForm.max_capacity_acres_per_day}
              onChange={(e) => setMachineForm({ ...machineForm, max_capacity_acres_per_day: e.target.value })}
              className="neo-input"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase">Location Address</label>
            <input
              type="text"
              value={machineForm.address}
              onChange={(e) => setMachineForm({ ...machineForm, address: e.target.value })}
              className="neo-input"
              required
            />
          </div>
          <button type="submit" className="neo-btn neo-btn-primary w-full py-2.5 text-xs">
            SAVE MACHINERY LISTING TO DATABASE
          </button>
        </form>
      )}

      {/* Add Buyer Listing Form */}
      {showAddBuyerListing && (
        <form onSubmit={handleAddBuyerListing} className="neo-box p-6 bg-white space-y-4 max-w-xl border-4 border-black">
          <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Add Residue Purchase Offer</h3>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase">Buying Purpose / Industrial Unit</label>
            <input
              type="text"
              value={buyerForm.buying_purpose}
              onChange={(e) => setBuyerForm({ ...buyerForm, buying_purpose: e.target.value })}
              placeholder="e.g. Biofuel Ethanol Plant & Pellets"
              className="neo-input"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Price Offered Per Ton (₹)</label>
              <input
                type="number"
                value={buyerForm.price_per_ton}
                onChange={(e) => setBuyerForm({ ...buyerForm, price_per_ton: e.target.value })}
                className="neo-input"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Total Tons Required</label>
              <input
                type="number"
                value={buyerForm.required_tons}
                onChange={(e) => setBuyerForm({ ...buyerForm, required_tons: e.target.value })}
                className="neo-input"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase">Facility Address</label>
            <input
              type="text"
              value={buyerForm.address}
              onChange={(e) => setBuyerForm({ ...buyerForm, address: e.target.value })}
              className="neo-input"
              required
            />
          </div>
          <button type="submit" className="neo-btn neo-btn-accent w-full py-2.5 text-xs">
            SAVE BUYER LISTING TO DATABASE
          </button>
        </form>
      )}

      {/* Active Listings Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">
          My Active Marketplace Listings
        </h2>

        {loading ? (
          <div className="neo-box p-8 text-center bg-gray-100 font-bold">Loading seller listings...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Machines Table */}
            <div className="neo-box p-6 bg-white space-y-4">
              <h3 className="text-xl font-black uppercase text-[#15803D] flex items-center space-x-2">
                <Tractor className="w-5 h-5" />
                <span>Equipment Inventory ({myListings.machines.length})</span>
              </h3>

              {myListings.machines.length === 0 ? (
                <div className="neo-empty-state text-xs p-4">No machinery listings added yet.</div>
              ) : (
                myListings.machines.map((m) => (
                  <div key={m.id} className="p-3 border-2 border-black bg-gray-50 space-y-1 text-xs font-bold">
                    <div className="flex justify-between">
                      <span className="text-sm">{m.name}</span>
                      <span className="text-green-800">₹{m.rate_per_acre}/acre</span>
                    </div>
                    <p className="text-gray-600">Type: {m.type} | Cap: {m.max_capacity_acres_per_day} Acres/Day</p>
                    <p className="text-gray-600">{m.address}</p>
                  </div>
                ))
              )}
            </div>

            {/* Buyer Listings Table */}
            <div className="neo-box p-6 bg-white space-y-4">
              <h3 className="text-xl font-black uppercase text-[#EAB308] flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5" />
                <span>Buyer Demands ({myListings.buyerListings.length})</span>
              </h3>

              {myListings.buyerListings.length === 0 ? (
                <div className="neo-empty-state text-xs p-4">No buyer demand listings added yet.</div>
              ) : (
                myListings.buyerListings.map((b) => (
                  <div key={b.id} className="p-3 border-2 border-black bg-gray-50 space-y-1 text-xs font-bold">
                    <div className="flex justify-between">
                      <span className="text-sm">{b.buying_purpose}</span>
                      <span className="text-yellow-700">₹{b.price_per_ton}/ton</span>
                    </div>
                    <p className="text-gray-600">Req: {b.required_tons} Tons | Quality: {b.min_quality}</p>
                    <p className="text-gray-600">{b.address}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Received Bookings & Connections */}
      <div className="neo-box p-6 bg-white space-y-4">
        <h2 className="text-2xl font-black uppercase border-b-2 border-black pb-2">
          Received Farmer Bookings & Offers
        </h2>

        {myListings.bookings.length === 0 && myListings.connectionRequests.length === 0 ? (
          <p className="text-sm font-semibold text-gray-500 py-4 text-center">No booking or connection requests received yet.</p>
        ) : (
          <div className="space-y-3">
            {myListings.bookings.map((b) => (
              <div key={b.id} className="p-4 border-2 border-black bg-green-50 flex flex-wrap items-center justify-between text-xs font-bold gap-2">
                <div>
                  <span className="neo-badge bg-[#15803D] text-white">MACHINERY BOOKING</span>
                  <p className="text-sm mt-1">{b.farmer_name} ({b.farmer_phone}) booked {b.machine_name}</p>
                  <p className="text-gray-600">Farm: {b.farm_name} | Date: {b.booking_date} | {b.acres} Acres</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-green-900">Total: ₹{b.total_price.toLocaleString('en-IN')}</span>
                  <span className="neo-badge bg-yellow-300 text-black block mt-1">{b.status}</span>
                </div>
              </div>
            ))}

            {myListings.connectionRequests.map((cr) => (
              <div key={cr.id} className="p-4 border-2 border-black bg-yellow-50 flex flex-wrap items-center justify-between text-xs font-bold gap-2">
                <div>
                  <span className="neo-badge bg-[#EAB308] text-black">BUYER SALE OFFER</span>
                  <p className="text-sm mt-1">{cr.farmer_name} ({cr.farmer_phone}) offered stubble</p>
                  <p className="text-gray-600">Est. Volume: {cr.estimated_tons} Tons @ ₹{cr.offered_price_per_ton}/ton</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-yellow-900">Total: ₹{cr.total_estimated_value.toLocaleString('en-IN')}</span>
                  <span className="neo-badge bg-green-300 text-black block mt-1">{cr.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
