import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authRequest } from '../context/AuthContext';
import { AuthShell, Field } from './Login';
import { ErrorMessage } from './Signup';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await authRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ reset_token: location.state?.resetToken, new_password: password, confirm_password: confirmPassword }) });
      navigate('/login', { replace: true, state: { message: 'Password reset successfully. Sign in with your new password.' } });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Your phone is verified. Set a new password to continue.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button disabled={submitting || !location.state?.resetToken} className="neo-btn neo-btn-primary w-full">{submitting ? 'Updating...' : 'Update password'}</button>
      </form>
    </AuthShell>
  );
}