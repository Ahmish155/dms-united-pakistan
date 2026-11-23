import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, UserCheck, UserX, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemRole } from '@dms/shared';

export const SuperAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await ApiService.get<any[]>('/auth/pending-users');
      setPendingUsers(data);
    } catch (err: any) {
      console.error('Failed to load pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      await ApiService.patch(`/auth/users/${id}/approve`, {});
      setStatusMessage(`Approved ${name}. A clean default sector workspace has been created for them.`);
      await fetchPendingUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await ApiService.patch(`/auth/users/${id}/reject`, {});
      await fetchPendingUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.systemRole !== SystemRole.SUPER_ADMIN) {
    return (
      <div className="rounded-xl border border-surface-border bg-white p-8 text-center space-y-3">
        <ShieldAlert className="mx-auto h-8 w-8 text-status-error" />
        <h2 className="text-base font-bold text-typography-main">Restricted Area</h2>
        <p className="text-xs text-typography-secondary">
          Only the designated Super Admin has permission to review and approve newly registered accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-typography-main">
          Super Admin Console
        </h1>
        <p className="text-xs text-typography-secondary mt-0.5">
          Review, approve, or reject new Secretary Dawat registrations.
        </p>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-typography-main uppercase tracking-wide">
            Pending Account Approvals ({pendingUsers.length})
          </h2>
          <button
            onClick={fetchPendingUsers}
            className="text-xs font-semibold text-brand-red hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-typography-secondary">
            Loading pending accounts...
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-typography-muted italic">
            No pending user registration requests. All accounts are up to date.
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {pendingUsers.map((u) => (
              <div key={u._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-typography-main">{u.name}</span>
                    <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5">
                      Pending Approval
                    </span>
                  </div>
                  <div className="text-[11px] text-typography-secondary mt-0.5">
                    Email: <span className="font-mono">{u.email}</span> • Registered on: {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading === u._id}
                    onClick={() => handleApprove(u._id, u.name)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Approve & Create Workspace</span>
                  </button>
                  <button
                    disabled={actionLoading === u._id}
                    onClick={() => handleReject(u._id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
