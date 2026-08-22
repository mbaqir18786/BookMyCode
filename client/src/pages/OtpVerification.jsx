import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authRequest } from '../context/AuthContext';
import { AuthShell, Field } from './Login';
import { ErrorMessage } from './Signup';

export default function OtpVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const phone = location.state?.phone || '';
  const purpose = location.state?.purpose || 'signup';
  const demoOtp = location.state?.demoOtp || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await authRequest('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code, purpose }) });
      navigate(purpose === 'signup' ? '/signup' : '/reset-password', { state: { phone, verificationToken: data.verification_token, resetToken: data.reset_token } });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Verify your phone" subtitle={`Enter the 6-digit code sent to ${phone}`}>
      {/* Demo OTP Banner */}
      {demoOtp && (
        <div style={{
          background: '#fef08a',
          border: '2px solid #ca8a04',
          borderRadius: 4,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#92400e', margin: 0 }}>
              📋 Demo Mode — Your OTP
            </p>
            <p style={{ fontSize: 24, fontWeight: 900, letterSpacing: 6, color: '#1c1917', margin: '4px 0 0 0' }}>
              {demoOtp}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCode(demoOtp)}
            style={{
              background: '#15803d',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '8px 14px',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Auto-fill ↓
          </button>
        </div>
      )}
      <form onSubmit={submit} className="space-y-5">
        <Field label="One-time password" value={code} onChange={setCode} inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="one-time-code" />
        <p className="text-xs font-bold text-gray-600">The code expires in 5 minutes. You have 3 attempts.</p>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button disabled={submitting} className="neo-btn neo-btn-primary w-full">{submitting ? 'Verifying...' : 'Verify OTP'}</button>
      </form>
    </AuthShell>
  );
}