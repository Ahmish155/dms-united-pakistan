import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await ApiService.post<{ token: string; user: any }>('/auth/login', {
        email,
        password
      });

      login(result.token, result.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-surface-border bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red text-white shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-typography-main">
            United Pakistan
          </h2>
          <p className="text-xs text-typography-secondary mt-1">
            Dawati Management System (DMS)
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-status-error border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-typography-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="secretary@gulraiz.dms"
                className="input-field pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-typography-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-surface-border text-center">
          <span className="text-[11px] font-semibold text-typography-muted uppercase tracking-wider block mb-2">
            Demo Credentials
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo('secretary.gulraiz@dms.pk', 'GulraizSec2026!')}
              className="flex-1 rounded-md border border-surface-border bg-surface-secondary py-1.5 text-[11px] font-medium text-typography-main hover:bg-gray-100"
            >
              Secretary Dawat
            </button>
            <button
              type="button"
              onClick={() => fillDemo('viewer@dms.pk', 'Viewer2026!')}
              className="flex-1 rounded-md border border-surface-border bg-surface-secondary py-1.5 text-[11px] font-medium text-typography-main hover:bg-gray-100"
            >
              Spectator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
