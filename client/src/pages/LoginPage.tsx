import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { auth, googleProvider, signInWithPopup } from '../config/firebase';
import { ShieldCheck, Lock, Mail, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        const result = await ApiService.post<any>('/auth/register', {
          name,
          email,
          password
        });

        if (result.pendingApproval) {
          setSuccessMsg(result.message);
          setIsRegister(false);
        } else if (result.token) {
          login(result.token, result.user);
          const pending = localStorage.getItem('dms_pending_invite');
          if (pending) {
            localStorage.removeItem('dms_pending_invite');
            navigate(pending);
          } else {
            navigate('/');
          }
        }
      } else {
        const result = await ApiService.post<{ token: string; user: any }>('/auth/login', {
          email,
          password
        });

        login(result.token, result.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const result = await ApiService.post<{ token: string; user: any }>('/auth/firebase-login', {
        idToken,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'Authorized User'
      });

      login(result.token, result.user);
      navigate('/');
    } catch (err: any) {
      console.warn('Firebase popup sign-in fallback:', err);
      setError(err.message || 'Google Sign-in failed. Please use standard email/password.');
    } finally {
      setLoading(false);
    }
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

        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-typography-main mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Secretary Name"
                className="input-field text-xs"
              />
            </div>
          )}

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
                placeholder="user@unitedpakistan.pk"
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
            {loading
              ? 'Processing...'
              : isRegister
              ? 'Create Account'
              : 'Sign In with Email'}
          </button>

          {/* Firebase Google Sign-In */}
          <div className="relative my-3 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <span className="relative bg-white px-2 text-[10px] uppercase tracking-wider text-typography-muted">
              Or continue with
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-white py-2 text-xs font-semibold text-typography-main hover:bg-surface-secondary transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Account</span>
          </button>
        </form>

        <div className="pt-3 border-t border-surface-border text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-xs font-semibold text-brand-red hover:underline"
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : 'New Secretary? Register an Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
