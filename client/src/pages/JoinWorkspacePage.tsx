import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle2, AlertTriangle, ArrowRight, Eye, LogIn } from 'lucide-react';

export const JoinWorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not logged in, store the invite URL in localStorage so user can return after login
    if (!user) {
      localStorage.setItem('dms_pending_invite', window.location.pathname + window.location.search);
    }
  }, [user]);

  const handleSubmitRequest = async () => {
    if (!workspaceId || !token) {
      setError('Invalid invite link. Missing workspace ID or invite token.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await ApiService.post('/workspaces/access-requests/submit', {
        workspaceId,
        token
      });
      setSubmitted(true);
      localStorage.removeItem('dms_pending_invite');
    } catch (err: any) {
      setError(err.message || 'Failed to submit spectator access request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-white p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red-light text-brand-red mb-2">
            <Eye className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-typography-main">Spectator Access Invite</h1>
          <p className="text-xs text-typography-secondary">
            You have been invited to observe Sector Dawati activities as a Spectator.
          </p>
        </div>

        {!token ? (
          <div className="rounded-xl bg-red-50 p-4 border border-status-error/20 text-xs text-status-error flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Invalid Invite Link</p>
              <p className="mt-1">This link is missing a security token. Please ask the Sector Secretary for a fresh link.</p>
            </div>
          </div>
        ) : !user ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-200 text-xs text-typography-main space-y-2">
              <p className="font-semibold text-blue-900">Account Required</p>
              <p className="text-blue-800">
                You must be logged into your DMS account to claim this spectator invitation.
              </p>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Log In to Accept Invite</span>
            </Link>
          </div>
        ) : submitted ? (
          <div className="rounded-xl bg-green-50 p-5 border border-status-success/20 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-status-success mx-auto" />
            <h3 className="font-bold text-sm text-typography-main">Request Submitted!</h3>
            <p className="text-xs text-typography-secondary">
              Your spectator access request has been forwarded to the Sector Secretary. Once approved, you will be able to select this sector workspace.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary w-full py-2 text-xs mt-2"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-surface-secondary p-4 border border-surface-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-typography-secondary">Account:</span>
                <span className="font-bold text-typography-main">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-typography-secondary">Email:</span>
                <span className="text-typography-main">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-typography-secondary">Requested Role:</span>
                <span className="font-semibold text-brand-red">Spectator (Read-Only)</span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-status-error border border-status-error/20">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmitRequest}
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting Request...' : 'Submit Spectator Access Request'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
