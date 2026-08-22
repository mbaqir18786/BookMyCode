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
      <form onSubmit={submit} className="space-y-5">
        <Field label="One-time password" value={code} onChange={setCode} inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="one-time-code" />
        <p className="text-xs font-bold text-gray-600">The code expires in 5 minutes. You have 3 attempts.</p>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button disabled={submitting} className="neo-btn neo-btn-primary w-full">{submitting ? 'Verifying...' : 'Verify OTP'}</button>
      </form>
    </AuthShell>
  );
}