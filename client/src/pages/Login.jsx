import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { getDashboardPath, useAuth } from '../context/AuthContext';

export default function Login() {
  const { isAuthenticated, role, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(getDashboardPath(role), { replace: true });
  }, [isAuthenticated, navigate, role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(identifier, password);
      navigate(location.state?.from || getDashboardPath(user.role), { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your crop residue portal.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Username or phone" value={identifier} onChange={setIdentifier} autoComplete="username" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <p className="border-2 border-red-800 bg-red-100 p-3 text-sm font-bold text-red-900">{error}</p>}
        <button disabled={submitting} className="neo-btn neo-btn-primary w-full gap-2">
          <LogIn className="h-4 w-4" /> {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <div className="flex justify-between text-sm font-bold underline">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>

        {/* Quick Demo Credentials */}
        <div className="mt-4 border-t-2 border-black pt-4 space-y-2">
          <p className="text-[10px] font-black uppercase text-gray-600 tracking-wider">⚡ Quick Demo Logins (Password: admin123)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIdentifier('farmer');
                setPassword('admin123');
              }}
              className="neo-btn bg-[#15803D] text-white text-[11px] font-bold py-1.5 px-2 text-center"
            >
              🌾 Farmer (Demo)
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('seller');
                setPassword('admin123');
              }}
              className="neo-btn bg-[#EAB308] text-black text-[11px] font-bold py-1.5 px-2 text-center"
            >
              🚜 Seller (Demo)
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('superadmin');
                setPassword('admin123');
              }}
              className="neo-btn bg-[#0284C7] text-white text-[11px] font-bold py-1.5 px-2 text-center"
            >
              🛡️ Super Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('govadmin');
                setPassword('admin123');
              }}
              className="neo-btn bg-[#C2410C] text-white text-[11px] font-bold py-1.5 px-2 text-center"
            >
              🏛️ Govt DAO
            </button>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto max-w-lg py-8 md:py-16">
      <div className="neo-box bg-[#EAB308] p-6 md:p-8">
        <span className="neo-badge bg-[#15803D] text-white">CROP RESIDUE PORTAL</span>
        <h1 className="mt-4 text-3xl font-black uppercase">{title}</h1>
        <p className="mb-6 mt-2 font-semibold">{subtitle}</p>
        <div className="neo-box-static bg-white p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text', ...props }) {
  return (
    <label className="block space-y-1 text-sm font-black uppercase">
      <span>{label}</span>
      <input className="neo-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} required {...props} />
    </label>
  );
}