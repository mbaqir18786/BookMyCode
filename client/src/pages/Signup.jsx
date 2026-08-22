import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { getDashboardPath, useAuth, authRequest } from '../context/AuthContext';
import { AuthShell, Field } from './Login';

export default function Signup() {
  const { completeSignup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const verifiedPhone = location.state?.phone || '';
  const verificationToken = location.state?.verificationToken || '';
  const [phone, setPhone] = useState(verifiedPhone);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('farmer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const requestOtp = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await authRequest('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) });
      navigate('/verify-otp', { state: { phone, purpose: 'signup' } });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await completeSignup({ verification_token: verificationToken, name, username, password, confirm_password: confirmPassword, role });
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!verificationToken) {
    return (
      <AuthShell title="Create your account" subtitle="Verify your phone before choosing your portal details.">
        <form onSubmit={requestOtp} className="space-y-5">
          <Field label="Phone number" value={phone} onChange={setPhone} type="tel" autoComplete="tel" placeholder="+919876543210" />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <button className="neo-btn neo-btn-primary w-full">Send OTP</button>
          <p className="text-center text-sm font-bold">Already registered? <Link className="underline" to="/login">Sign in</Link></p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Finish registration" subtitle={`Verified phone: ${phone}`}>
      <form onSubmit={submitSignup} className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        <label className="block space-y-1 text-sm font-black uppercase">
          <span>Portal role</span>
          <select className="neo-input" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="farmer">Farmer</option>
            <option value="seller">Seller</option>
          </select>
        </label>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button disabled={submitting} className="neo-btn neo-btn-primary w-full gap-2"><UserPlus className="h-4 w-4" />{submitting ? 'Creating account...' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}

export function ErrorMessage({ children }) {
  return <p className="border-2 border-red-800 bg-red-100 p-3 text-sm font-bold text-red-900">{children}</p>;
}