import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authRequest } from '../context/AuthContext';
import { AuthShell, Field } from './Login';
import { ErrorMessage } from './Signup';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await authRequest('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ phone }) });
      navigate('/verify-otp', { state: { phone, purpose: 'password_reset' } });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We will send a verification code to your registered phone.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Phone number" value={phone} onChange={setPhone} type="tel" autoComplete="tel" />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button disabled={submitting} className="neo-btn neo-btn-primary w-full">{submitting ? 'Sending...' : 'Send reset OTP'}</button>
        <p className="text-center text-sm font-bold"><Link className="underline" to="/login">Back to sign in</Link></p>
      </form>
    </AuthShell>
  );
}