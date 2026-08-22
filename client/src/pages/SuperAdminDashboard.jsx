import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../context/CurrentUserContext';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, FileText, Lock, RefreshCw } from 'lucide-react';
import API_BASE_URL from '../config/api';

export default function SuperAdminDashboard() {
  const { currentUser } = useCurrentUser();

  const [sellers, setSellers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Helper to evaluate AI verification result from KYB service
  const getAIStatus = (seller) => {
    if (!seller.kyc_ai_result) return { label: 'AI PENDING', color: '#9ca3af', verdict: null, reason: 'AI has not run yet.', checks: {}, confidence: 0 };
    try {
      const r = typeof seller.kyc_ai_result === 'string' ? JSON.parse(seller.kyc_ai_result) : seller.kyc_ai_result;
      const isApproved = r.verdict === 'APPROVED';
      // Convert checks array [{name, passed, detail}] to {name: 'VALID'|'INVALID'} map
      const checksMap = {};
      if (Array.isArray(r.checks)) {
        r.checks.forEach(c => {
          checksMap[c.name] = c.passed ? 'VALID' : 'INVALID';
        });
      }
      return {
        label: isApproved ? '✅ AI APPROVED' : '❌ AI REJECTED',
        color: isApproved ? '#15803d' : '#b91c1c',
        verdict: r.verdict,
        reason: r.reason || '',
        checks: checksMap,
        checkDetails: r.checks || [],
        confidence: r.confidence || 0
      };
    } catch (e) {
      return { label: '⚠ AI ERROR', color: '#d97706', verdict: null, reason: 'Could not parse AI result.', checks: {}, checkDetails: [], confidence: 0 };
    }
  };
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sellersRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/superadmin/kyc-queue`),
        fetch(`${API_BASE_URL}/api/superadmin/audit-logs`)
      ]);

      if (sellersRes.ok && logsRes.ok) {
        const sellersData = await sellersRes.json();
        const logsData = await logsRes.json();
        setSellers(sellersData);
        setAuditLogs(logsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId) => {
    try {
      setProcessingId(sellerId);
      const res = await fetch(`${API_BASE_URL}/api/superadmin/kyc/${sellerId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser.id, notes: 'Verified business registration and identity' })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (sellerId) => {
    const reason = window.prompt('Enter rejection reason for seller:', 'Incomplete verification documents');
    if (!reason) return;

    try {
      setProcessingId(sellerId);
      const res = await fetch(`${API_BASE_URL}/api/superadmin/kyc/${sellerId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser.id, reason })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingSellers = sellers.filter((s) => s.kyc_status === 'pending');
  const processedSellers = sellers.filter((s) => s.kyc_status !== 'pending');

  return (
    <div className="space-y-8 pb-16">
      {/* AI status badge helper is used inside the pending seller cards */}
      {/* Super Admin Banner */}
      <div className="neo-box p-6 bg-[#E0F2FE] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="neo-badge bg-[#0284C7] text-white">SUPER ADMIN VERIFICATION PANEL</span>
          <h1 className="text-3xl font-black uppercase text-[#0F172A] mt-1">Seller KYC Validation & Audit</h1>
          <p className="font-semibold text-sm text-gray-800">
            Active Admin: <span className="font-bold underline">{currentUser.name}</span>
          </p>
        </div>

        <button onClick={fetchData} className="neo-btn bg-white text-black text-xs flex items-center space-x-1">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Pending KYC Approval Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-4 border-black pb-2">
          <h2 className="text-2xl font-black uppercase flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <span>Seller KYC Applications ({sellers.length})</span>
          </h2>
          <span className="neo-badge bg-yellow-300 text-black">REAL-TIME DB STATE ENGINE</span>
        </div>

        {loading ? (
          <div className="neo-box p-8 text-center bg-gray-100 font-bold">Querying pending KYC submissions...</div>
        ) : pendingSellers.length === 0 ? (
          <div className="neo-empty-state space-y-2">
            <h3 className="text-xl font-black uppercase">KYC Queue Cleared</h3>
            <p className="font-semibold text-sm text-gray-700">All submitted seller applications have been validated.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sellers.map((s) => {
              const ai = getAIStatus(s);
              const isPending = s.kyc_status === 'pending';
              return (
              <div key={s.id} className="neo-box p-6 bg-white flex flex-col justify-between space-y-4 border-4 border-black">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="neo-badge bg-yellow-200 text-black uppercase">{s.seller_type.replace('_', ' ')}</span>
                    <span className={`neo-badge font-bold text-white ${
                      s.kyc_status === 'approved' ? 'bg-green-700' :
                      s.kyc_status === 'rejected' ? 'bg-red-700' :
                      'bg-yellow-500 text-black'
                    }`}>
                      {s.kyc_status === 'approved' ? '✅ APPROVED' : s.kyc_status === 'rejected' ? '❌ REJECTED' : '⏳ PENDING'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black uppercase text-[#0F172A]">{s.business_name}</h3>
                    <p className="text-xs font-semibold text-gray-600">Owner: {s.owner_name} ({s.phone})</p>
                  </div>

                  <div className="text-xs font-semibold text-gray-700 bg-gray-50 p-3 border-2 border-black space-y-2">
                    <p>Address: <strong>{s.address}</strong></p>
                    <p>Submitted: <strong>{new Date(s.created_at).toLocaleDateString()}</strong></p>

                    <div className="border-t border-gray-300 pt-2 space-y-1.5 font-mono text-[11px]">
                      {[['🪪','Aadhaar','aadhar_no','aadhar_doc_url','aadhaar'],['📄','PAN','pan_no','pan_doc_url','pan'],['🏢','GSTIN','gst_no','gst_doc_url','gstin'],['📜','Udyam','udyam_no','udyam_doc_url','udyam']].map(([icon, label, numKey, urlKey, checkKey]) => (
                        <div key={label} className="flex items-center justify-between bg-white p-1.5 border border-gray-300">
                          <span>{icon} {label}: <strong>{s[numKey] || 'Not Provided'}</strong></span>
                          <div className="flex items-center gap-2">
                            {ai.checks[checkKey] && (
                              <span style={{ color: ai.checks[checkKey] === 'VALID' ? '#15803d' : ai.checks[checkKey] === 'INVALID' ? '#b91c1c' : '#6b7280', fontWeight: 800 }}>
                                {ai.checks[checkKey] === 'VALID' ? '✓' : ai.checks[checkKey] === 'INVALID' ? '✗' : '–'}
                              </span>
                            )}
                            {s[urlKey] ? (
                              <a href={s[urlKey]} target="_blank" rel="noreferrer" className="text-blue-700 underline font-bold">View Doc</a>
                            ) : <span className="text-gray-400">No file</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Verdict Card */}
                  <div style={{ background: ai.verdict ? (ai.verdict === 'APPROVED' ? '#f0fdf4' : '#fef2f2') : '#f9fafb', border: `2px solid ${ai.color}`, borderRadius: 4, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 900, fontSize: 12, color: ai.color, textTransform: 'uppercase', letterSpacing: 1 }}>{ai.label}</span>
                      {ai.confidence > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>Confidence: {ai.confidence}%</span>}
                    </div>
                    {ai.reason && <p style={{ fontSize: 11, color: '#374151', marginTop: 4, fontWeight: 600 }}>{ai.reason}</p>}
                  </div>
                </div>

                {/* Manual Override — Super Admin always has final say */}
                <div className="space-y-2 pt-2 border-t-2 border-black">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Super Admin Override</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleApprove(s.id)}
                      disabled={processingId === s.id}
                      className="neo-btn neo-btn-primary text-xs py-2.5 flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APPROVE KYC</span>
                    </button>
                    <button
                      onClick={() => handleReject(s.id)}
                      disabled={processingId === s.id}
                      className="neo-btn neo-btn-danger text-xs py-2.5 flex items-center justify-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>REJECT</span>
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Processed Sellers Verification Table */}
      <div className="neo-box p-6 bg-white space-y-4">
        <h2 className="text-2xl font-black uppercase border-b-2 border-black pb-2">
          Verified & Processed Sellers Database ({processedSellers.length})
        </h2>

        <div className="space-y-3">
          {processedSellers.map((s) => (
            <div key={s.id} className="p-4 border-2 border-black bg-gray-50 flex flex-wrap items-center justify-between text-xs font-bold gap-2">
              <div>
                <span className="text-sm font-black uppercase">{s.business_name}</span>
                <p className="text-gray-600">{s.seller_type} | Owner: {s.owner_name} ({s.phone}) | {s.address}</p>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`neo-badge ${s.kyc_status === 'approved' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
                  {s.kyc_status.toUpperCase()}
                </span>
                {s.kyc_status === 'approved' ? (
                  <button onClick={() => handleReject(s.id)} className="neo-btn bg-red-100 text-red-900 text-[10px] py-1 px-2">
                    Revoke Approval
                  </button>
                ) : (
                  <button onClick={() => handleApprove(s.id)} className="neo-btn bg-green-100 text-green-900 text-[10px] py-1 px-2">
                    Approve Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="neo-box p-6 bg-white space-y-4">
        <h2 className="text-2xl font-black uppercase border-b-2 border-black pb-2 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-[#0284C7]" />
          <span>Super Admin Audit Log ({auditLogs.length})</span>
        </h2>

        <div className="max-h-60 overflow-y-auto space-y-2 text-xs font-semibold">
          {auditLogs.length === 0 ? (
            <p className="text-gray-500 py-2">No audit records logged yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-2 border border-black bg-gray-100 flex justify-between">
                <div>
                  <span className="font-bold text-blue-900 uppercase">[{log.action}]</span> {log.details}
                </div>
                <span className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
