import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Settings,
  Sliders,
  Shield,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  XCircle,
  UserCheck,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { WorkspaceRole, AccessRequestStatus } from '@dms/shared';

export const SettingsPage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();

  const [settings, setSettings] = useState<any | null>(null);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Thresholds state
  const [maduDays, setMaduDays] = useState<number>(14);
  const [mdfDays, setMdfDays] = useState<number>(21);
  const [daeenDays, setDaeenDays] = useState<number>(21);
  const [dfDays, setDfDays] = useState<number>(30);
  const [gmDays, setGmDays] = useState<number>(30);
  const [allowSpectatorExports, setAllowSpectatorExports] = useState<boolean>(false);

  // Invite link state
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettingsAndRequests = async () => {
    try {
      setLoading(true);
      const wsId = activeWorkspace?.id || (activeWorkspace as any)?._id;
      const [settingsData, requestsData] = await Promise.all([
        ApiService.get<any>('/settings'),
        ApiService.get<any[]>(`/workspaces/${wsId}/access-requests`)
      ]);

      setSettings(settingsData);
      setAccessRequests(requestsData);

      if (settingsData?.thresholds) {
        setMaduDays(settingsData.thresholds.maduDays);
        setMdfDays(settingsData.thresholds.mdfDays);
        setDaeenDays(settingsData.thresholds.daeenDays);
        setDfDays(settingsData.thresholds.dfDays);
        setGmDays(settingsData.thresholds.gmDays);
        setAllowSpectatorExports(settingsData.allowSpectatorExports || false);
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchSettingsAndRequests();
    }
  }, [activeWorkspace]);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await ApiService.patch('/settings', {
        thresholds: {
          maduDays,
          mdfDays,
          daeenDays,
          dfDays,
          gmDays
        },
        allowSpectatorExports
      });
      alert('Activity thresholds updated successfully! Statuses recalculated.');
      await fetchSettingsAndRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const wsId = activeWorkspace?.id || (activeWorkspace as any)?._id;
      const res = await ApiService.post<any>(`/workspaces/${wsId}/spectator-link`);
      const fullUrl = `${window.location.origin}${res.link}`;
      setInviteLink(fullUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to generate link');
    }
  };

  const handleDecideRequest = async (
    requestId: string,
    decision: AccessRequestStatus
  ) => {
    try {
      const wsId = activeWorkspace?.id || (activeWorkspace as any)?._id;
      await ApiService.patch(
        `/workspaces/${wsId}/access-requests/${requestId}`,
        { status: decision }
      );
      await fetchSettingsAndRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to process request');
    }
  };

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-typography-main">
          Workspace Settings & Spectators
        </h1>
        <p className="text-xs text-typography-secondary mt-0.5">
          Configure activity thresholds, permissions, and spectator approvals for {activeWorkspace?.name}
        </p>
      </div>

      {!isSecretary && (
        <div className="rounded-xl border border-surface-border bg-white p-6 text-center space-y-2">
          <Lock className="mx-auto h-6 w-6 text-typography-muted" />
          <h3 className="text-sm font-semibold text-typography-main">Read-Only Viewer Account</h3>
          <p className="text-xs text-typography-secondary">
            Only the Sector Secretary Dawat can modify workspace activity thresholds and spectator permissions.
          </p>
        </div>
      )}

      {isSecretary && (
        <div className="space-y-6">
          {/* Configurable Activity Thresholds (Part 6.1) */}
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-brand-red" />
              <h2 className="text-base font-bold text-typography-main">
                Configurable Activity Thresholds (Days)
              </h2>
            </div>
            <p className="text-xs text-typography-secondary">
              The Dynamic Activity Engine calculates active and inactive statuses based on completed qualifying records within these day counts.
            </p>

            <form onSubmit={handleSaveThresholds} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-typography-main mb-1">
                    Madu Activity Threshold:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      required
                      value={maduDays}
                      onChange={(e) => setMaduDays(parseInt(e.target.value, 10))}
                      className="input-field text-xs"
                    />
                    <span className="text-typography-secondary">days</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-typography-main mb-1">
                    MDF Activity Threshold:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      required
                      value={mdfDays}
                      onChange={(e) => setMdfDays(parseInt(e.target.value, 10))}
                      className="input-field text-xs"
                    />
                    <span className="text-typography-secondary">days</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-typography-main mb-1">
                    Daeen Activity Threshold:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      required
                      value={daeenDays}
                      onChange={(e) => setDaeenDays(parseInt(e.target.value, 10))}
                      className="input-field text-xs"
                    />
                    <span className="text-typography-secondary">days</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-typography-main mb-1">
                    Dialogue Forum Participation:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      required
                      value={dfDays}
                      onChange={(e) => setDfDays(parseInt(e.target.value, 10))}
                      className="input-field text-xs"
                    />
                    <span className="text-typography-secondary">days</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-typography-main mb-1">
                    Group Meeting Participation:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      required
                      value={gmDays}
                      onChange={(e) => setGmDays(parseInt(e.target.value, 10))}
                      className="input-field text-xs"
                    />
                    <span className="text-typography-secondary">days</span>
                  </div>
                </div>
              </div>

              {/* Spectator Download Permission */}
              <div className="pt-2 border-t border-surface-border">
                <label className="flex items-center gap-2 text-xs font-semibold text-typography-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSpectatorExports}
                    onChange={(e) => setAllowSpectatorExports(e.target.checked)}
                    className="rounded border-gray-300 text-brand-red focus:ring-brand-red h-4 w-4"
                  />
                  <span>Allow Spectators to download reports (Word, Excel, Text)</span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-primary text-xs py-2 px-4 shadow-sm"
                >
                  {savingSettings ? 'Saving...' : 'Update Thresholds'}
                </button>
              </div>
            </form>
          </div>

          {/* Spectator Invite Link Generator (Part 3.3) */}
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-brand-red" />
                <h2 className="text-base font-bold text-typography-main">
                  Spectator Access Invite Link
                </h2>
              </div>

              <button
                onClick={handleGenerateInvite}
                className="btn-secondary gap-1.5 text-xs py-1.5"
              >
                <span>Generate New Link</span>
              </button>
            </div>
            <p className="text-xs text-typography-secondary">
              Visitors using this link can register and request read-only access. Access requires your explicit approval before they can view sector data.
            </p>

            {inviteLink && (
              <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-lg border border-surface-border text-xs">
                <span className="font-mono text-typography-main truncate flex-1">
                  {inviteLink}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="btn-primary text-xs py-1 px-3 whitespace-nowrap"
                >
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            )}
          </div>

          {/* Spectator Access Request Queue (Part 3.3) */}
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-red" />
              <h2 className="text-base font-bold text-typography-main">
                Spectator Access Requests Queue
              </h2>
            </div>

            {accessRequests.length === 0 ? (
              <p className="text-xs text-typography-secondary italic py-2">
                No access requests submitted yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-secondary text-typography-secondary border-b border-surface-border">
                    <tr>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Requested At</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {accessRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold text-typography-main">
                          {req.userId?.name || 'Unknown'}
                        </td>
                        <td className="p-2.5 text-typography-secondary">
                          {req.userId?.email || 'N/A'}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          {new Date(req.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              req.status === AccessRequestStatus.APPROVED
                                ? 'bg-emerald-50 text-status-success border border-emerald-200'
                                : req.status === AccessRequestStatus.PENDING
                                ? 'bg-amber-50 text-status-warning border border-amber-200'
                                : 'bg-red-50 text-status-error border border-red-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                          {req.status === AccessRequestStatus.PENDING && (
                            <>
                              <button
                                onClick={() =>
                                  handleDecideRequest(req._id, AccessRequestStatus.APPROVED)
                                }
                                className="rounded px-2 py-1 bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleDecideRequest(req._id, AccessRequestStatus.REJECTED)
                                }
                                className="rounded px-2 py-1 bg-gray-200 text-typography-main text-[11px] hover:bg-gray-300"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {req.status === AccessRequestStatus.APPROVED && (
                            <button
                              onClick={() =>
                                handleDecideRequest(req._id, AccessRequestStatus.REVOKED)
                              }
                              className="rounded px-2 py-1 bg-red-50 text-status-error border border-red-200 font-semibold text-[11px] hover:bg-red-100"
                            >
                              Revoke Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
