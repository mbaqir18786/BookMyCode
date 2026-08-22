import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrentUser } from '../context/CurrentUserContext';
import API_BASE_URL from '../config/api';
import { 
  ShieldCheck, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  ArrowLeft, 
  HelpCircle,
  FileCheck,
  CreditCard,
  Hash,
  FileSpreadsheet
} from 'lucide-react';

export default function KycVerificationPage() {
  const { currentUser: authUser } = useAuth();
  const { currentUser: contextUser } = useCurrentUser();
  const currentUser = authUser || contextUser || { id: 'usr_seller_1', name: 'Seller' };
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    business_name: '',
    seller_type: 'machinery_provider',
    phone: '',
    address: '',
    aadhar_no: '',
    pan_no: '',
    gst_no: '',
    udyam_no: '',
    aadhar_doc_url: '',
    pan_doc_url: '',
    gst_doc_url: '',
    udyam_doc_url: '',
    kyc_status: 'pending'
  });

  const [fileNames, setFileNames] = useState({
    aadhar: '',
    pan: '',
    gst: '',
    udyam: ''
  });

  const [dbOptions, setDbOptions] = useState({
    seller_types: [
      { value: 'machinery_provider', label: 'Machinery Provider (Equipment Rental)' },
      { value: 'residue_buyer', label: 'Residue Buyer (Biomass & Paddy Straw Buyer)' },
      { value: 'paper_mill', label: 'Paper Mill' },
      { value: 'compost_plant', label: 'Compost Plant' }
    ]
  });

  useEffect(() => {
    fetchSellerProfile();
    fetchOptions();
  }, [currentUser.id]);

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/options`);
      if (res.ok) {
        const data = await res.json();
        if (data.seller_types && data.seller_types.length > 0) {
          setDbOptions(prev => ({ ...prev, ...data }));
        }
      }
    } catch (e) {
      console.error('Failed to fetch DB options:', e);
    }
  };

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/sellers/profile?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          business_name: data.business_name || currentUser.name || '',
          seller_type: data.seller_type || 'machinery_provider',
          phone: data.phone || currentUser.phone || '',
          address: data.address || '',
          aadhar_no: data.aadhar_no || '',
          pan_no: data.pan_no || '',
          gst_no: data.gst_no || '',
          udyam_no: data.udyam_no || '',
          aadhar_doc_url: data.aadhar_doc_url || '',
          pan_doc_url: data.pan_doc_url || '',
          gst_doc_url: data.gst_doc_url || '',
          udyam_doc_url: data.udyam_doc_url || '',
          kyc_status: data.kyc_status || 'pending'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded file to base64 Data URL so it's instantly reviewable by Super Admin
  const handleFileUpload = (docKey, file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15 MB limit.');
      return;
    }

    setFileNames(prev => ({ ...prev, [docKey]: file.name }));

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setFormData(prev => ({
        ...prev,
        [`${docKey}_doc_url`]: dataUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validations
    if (!formData.business_name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMessage('Please fill in all general business details.');
      return;
    }
    if (!formData.aadhar_no || !formData.pan_no || !formData.gst_no || !formData.udyam_no) {
      setErrorMessage('Please provide all 4 official registration numbers (Aadhaar, PAN, GSTIN, Udyam).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/sellers/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: currentUser.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('KYC Verification Application submitted successfully! Super Admin has been notified for review.');
        fetchSellerProfile();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(data.error || 'Failed to submit KYC verification');
      }
    } catch (err) {
      setErrorMessage('Network error while submitting verification form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="neo-box p-12 text-center bg-white space-y-3">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-yellow-400 rounded-full mx-auto" />
        <h2 className="text-xl font-black uppercase">Loading Verification Portal...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between">
        <Link to="/seller" className="neo-btn bg-white text-black text-xs flex items-center space-x-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="neo-badge bg-[#EAB308] text-black font-black uppercase tracking-wider">
          KYB / KYC PORTAL
        </span>
      </div>

      {/* Hero Banner with Status */}
      <div className="neo-box p-6 bg-[#FEF08A] border-4 border-black space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="neo-badge bg-black text-white text-[10px]">OFFICIAL BUSINESS VERIFICATION</span>
            <h1 className="text-3xl font-black uppercase text-black">Seller & Buyer KYC Portal</h1>
            <p className="text-xs font-semibold text-gray-800">
              Submit your verified identity and commercial registration documents for Super Admin authentication.
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-gray-700">CURRENT STATUS</span>
            {formData.kyc_status === 'approved' && (
              <span className="neo-badge bg-green-700 text-white text-sm font-black flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> VERIFIED & ACTIVE
              </span>
            )}
            {formData.kyc_status === 'pending' && (
              <span className="neo-badge bg-yellow-400 text-black text-sm font-black flex items-center gap-1 border-2 border-black">
                <Clock className="w-4 h-4" /> PENDING SUPER ADMIN REVIEW
              </span>
            )}
            {formData.kyc_status === 'rejected' && (
              <span className="neo-badge bg-red-700 text-white text-sm font-black flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> REJECTED / ACTION REQUIRED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="neo-box p-4 bg-green-100 border-2 border-green-800 text-green-900 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-700" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="neo-box p-4 bg-red-100 border-2 border-red-800 text-red-900 font-bold text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Verification Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Business Profile */}
        <div className="neo-box p-6 bg-white space-y-4">
          <div className="border-b-2 border-black pb-2 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-700" />
              <span>1. Business & Entity Details</span>
            </h2>
            <span className="text-xs font-bold text-gray-500">Step 1 of 2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-black">Business / Enterprise Name *</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="neo-input"
                placeholder="e.g., Punjab Krishi Yantra Agro"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-black">Seller / Buyer Sub-Type *</label>
              <select
                value={formData.seller_type}
                onChange={(e) => setFormData({ ...formData, seller_type: e.target.value })}
                className="neo-input"
              >
                {dbOptions.seller_types.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-black">Registered Contact Phone *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="neo-input"
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-black">Operating Address / District *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="neo-input"
                placeholder="e.g., GT Road, Ludhiana, Punjab"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: 4 Core Documents Input & File Uploads */}
        <div className="neo-box p-6 bg-white space-y-6">
          <div className="border-b-2 border-black pb-2 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-green-700" />
              <span>2. Official Verification Documents (Aadhaar, PAN, GST, Udyam)</span>
            </h2>
            <span className="text-xs font-bold text-gray-500">Step 2 of 2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Aadhaar */}
            <div className="border-2 border-black p-4 bg-orange-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-black pb-1">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-black uppercase">1. Aadhaar Card</span>
                  </div>
                  <span className="neo-badge bg-black text-white text-[9px]">REQUIRED</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-700">12-Digit Aadhaar Number *</label>
                  <input
                    type="text"
                    value={formData.aadhar_no}
                    onChange={(e) => setFormData({ ...formData, aadhar_no: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    placeholder="XXXX XXXX XXXX"
                    className="neo-input text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-700">Upload Aadhaar File (PDF/Image)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('aadhar', e.target.files[0])}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-white hover:file:bg-yellow-200"
                  />
                  {formData.aadhar_doc_url && (
                    <p className="text-[10px] text-green-700 font-bold mt-1">✓ File Attached</p>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-gray-500">OR Direct Document URL</label>
                  <input
                    type="url"
                    value={formData.aadhar_doc_url.startsWith('data:') ? '' : formData.aadhar_doc_url}
                    onChange={(e) => setFormData({ ...formData, aadhar_doc_url: e.target.value })}
                    placeholder="https://.../aadhar.pdf"
                    className="neo-input text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: PAN */}
            <div className="border-2 border-black p-4 bg-blue-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-black pb-1">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase">2. Business / Personal PAN</span>
                  </div>
                  <span className="neo-badge bg-black text-white text-[9px]">REQUIRED</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-700">10-Digit PAN Number *</label>
                  <input
                    type="text"
                    value={formData.pan_no}
                    onChange={(e) => setFormData({ ...formData, pan_no: e.target.value.toUpperCase().slice(0, 10) })}
                    placeholder="e.g., ABCDE1234F"
                    className="neo-input text-xs font-mono uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-700">Upload PAN File (PDF/Image)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('pan', e.target.files[0])}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-white hover:file:bg-yellow-200"
                  />
                  {formData.pan_doc_url && (
                    <p className="text-[10px] text-green-700 font-bold mt-1">✓ File Attached</p>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-gray-500">OR Direct Document URL</label>
                  <input
                    type="url"
                    value={formData.pan_doc_url.startsWith('data:') ? '' : formData.pan_doc_url}
                    onChange={(e) => setFormData({ ...formData, pan_doc_url: e.target.value })}
                    placeholder="https://.../pan.pdf"
                    className="neo-input text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: GSTIN */}
            <div className="border-2 border-black p-4 bg-purple-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-black pb-1">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-black uppercase">3. GST Certificate (GSTIN)</span>
                  </div>
                  <span className="neo-badge bg-black text-white text-[9px]">REQUIRED</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-700">15-Digit GSTIN Number *</label>
                  <input
                    type="text"
                    value={formData.gst_no}
                    onChange={(e) => setFormData({ ...formData, gst_no: e.target.value.toUpperCase().slice(0, 15) })}
                    placeholder="e.g., 03AAAAA0000A1Z5"
                    className="neo-input text-xs font-mono uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-700">Upload GST Certificate (PDF/Image)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('gst', e.target.files[0])}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-white hover:file:bg-yellow-200"
                  />
                  {formData.gst_doc_url && (
                    <p className="text-[10px] text-green-700 font-bold mt-1">✓ File Attached</p>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-gray-500">OR Direct Document URL</label>
                  <input
                    type="url"
                    value={formData.gst_doc_url.startsWith('data:') ? '' : formData.gst_doc_url}
                    onChange={(e) => setFormData({ ...formData, gst_doc_url: e.target.value })}
                    placeholder="https://.../gst-cert.pdf"
                    className="neo-input text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Udyam */}
            <div className="border-2 border-black p-4 bg-emerald-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-black pb-1">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase">4. Udyam MSME Certificate</span>
                  </div>
                  <span className="neo-badge bg-black text-white text-[9px]">REQUIRED</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-700">Udyam Registration Number *</label>
                  <input
                    type="text"
                    value={formData.udyam_no}
                    onChange={(e) => setFormData({ ...formData, udyam_no: e.target.value.toUpperCase() })}
                    placeholder="e.g., UDYAM-PB-00-0000000"
                    className="neo-input text-xs font-mono uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-700">Upload Udyam Certificate (PDF/Image)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('udyam', e.target.files[0])}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-white hover:file:bg-yellow-200"
                  />
                  {formData.udyam_doc_url && (
                    <p className="text-[10px] text-green-700 font-bold mt-1">✓ File Attached</p>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-gray-500">OR Direct Document URL</label>
                  <input
                    type="url"
                    value={formData.udyam_doc_url.startsWith('data:') ? '' : formData.udyam_doc_url}
                    onChange={(e) => setFormData({ ...formData, udyam_doc_url: e.target.value })}
                    placeholder="https://.../udyam-cert.pdf"
                    className="neo-input text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between neo-box p-6 bg-black text-white">
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase text-yellow-400">Ready to Submit Application?</h3>
            <p className="text-xs text-gray-300">
              All credentials will be queued for Super Admin review and verification badge activation.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="neo-btn bg-[#EAB308] text-black font-black text-sm px-6 py-3 hover:bg-yellow-300 disabled:opacity-50"
          >
            {submitting ? 'Submitting Documents...' : 'SUBMIT FOR SUPER ADMIN VERIFICATION'}
          </button>
        </div>
      </form>
    </div>
  );
}
