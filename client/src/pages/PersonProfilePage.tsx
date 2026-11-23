import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import {
  ArrowLeft,
  CalendarCheck,
  TrendingUp,
  MapPin,
  Clock,
  UserCheck,
  UserX,
  Phone,
  Shield,
  FileText
} from 'lucide-react';
import { ActivityStatus } from '@dms/shared';

export const PersonProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await ApiService.get<any>(`/people/${id}`);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-typography-secondary">
        Loading person profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-surface-border bg-white p-8 text-center">
        <p className="text-sm font-semibold text-status-error">{error || 'Person not found'}</p>
        <Link to="/people" className="btn-secondary mt-4 inline-flex text-xs">
          Back to Directory
        </Link>
      </div>
    );
  }

  const { person, activity, meetings, promotions, transfers, associatedMadu } = data;
  const isActive = activity?.status === ActivityStatus.ACTIVE;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/people"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-typography-secondary hover:text-brand-red transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to People Directory</span>
        </Link>

        <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-typography-main">
                  {person.fullName}
                </h1>
                <span className={isActive ? 'badge-active' : 'badge-inactive'}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-typography-secondary">
                <span className="font-mono">{person.internalId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-brand-red" />
                  {person.currentUnitId?.name || 'No Unit'}
                </span>
                {person.contactNumber && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-typography-muted" />
                      {person.contactNumber}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-lg bg-brand-red px-2.5 py-1 text-xs font-semibold text-white">
                {person.currentStage}
              </span>
              {person.roles?.map((r: string) => (
                <span
                  key={r}
                  className="rounded-lg bg-surface-secondary border border-surface-border px-2.5 py-1 text-xs font-medium text-typography-main"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-surface-border pt-4 text-xs">
            <div>
              <span className="text-typography-secondary block">Total Completed IMs</span>
              <span className="text-lg font-bold text-typography-main">{meetings?.length || 0}</span>
            </div>
            <div>
              <span className="text-typography-secondary block">Days Since Last IM</span>
              <span className="text-lg font-bold text-typography-main">
                {activity?.daysSinceLastMeeting !== null ? `${activity.daysSinceLastMeeting}d` : 'None'}
              </span>
            </div>
            <div>
              <span className="text-typography-secondary block">Assigned Rabtakar</span>
              <span className="font-semibold text-typography-main truncate block">
                {person.primaryRabtakarId?.fullName || 'None'}
              </span>
            </div>
            <div>
              <span className="text-typography-secondary block">Default Daeen</span>
              <span className="font-semibold text-typography-main truncate block">
                {person.defaultDaeenId?.fullName || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Madu (If Rabtakar) */}
      {associatedMadu && associatedMadu.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-typography-main">
              Associated Madu ({associatedMadu.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {associatedMadu.map((madu: any) => (
              <Link
                key={madu._id}
                to={`/people/${madu._id}`}
                className="rounded-lg border border-surface-border p-3 hover:border-brand-red transition-colors text-xs space-y-1 block bg-surface-secondary/40"
              >
                <div className="font-bold text-typography-main">{madu.fullName}</div>
                <div className="text-[11px] text-typography-secondary flex justify-between">
                  <span>{madu.internalId}</span>
                  <span>{madu.currentUnitId?.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Meeting History */}
      <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-typography-main flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-brand-red" />
            <span>Individual Meeting History</span>
          </h2>
          <span className="text-xs text-typography-secondary">
            {meetings.length} recorded
          </span>
        </div>

        {meetings.length === 0 ? (
          <p className="text-xs text-typography-secondary italic py-4">
            No completed individual meetings recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-typography-secondary border-b border-surface-border">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Meeting #</th>
                  <th className="p-2.5">Unit (At Meeting)</th>
                  <th className="p-2.5">Primary Daeen</th>
                  <th className="p-2.5">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {meetings.map((m: any) => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="p-2.5 font-medium whitespace-nowrap">
                      {new Date(m.meetingDate).toLocaleDateString()}
                    </td>
                    <td className="p-2.5 font-semibold">#{m.meetingNumber}</td>
                    <td className="p-2.5">{m.unitId?.name || 'N/A'}</td>
                    <td className="p-2.5 font-medium">{m.primaryDaeenId?.fullName || 'N/A'}</td>
                    <td className="p-2.5 text-typography-secondary max-w-xs truncate">
                      {m.comments || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promotion & Transfer Lineage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Promotion History */}
        <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-typography-main flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-red" />
            <span>Promotion History</span>
          </h2>

          {promotions.length === 0 ? (
            <p className="text-xs text-typography-secondary italic py-2">
              No promotions recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {promotions.map((p: any) => (
                <div key={p._id} className="rounded-lg border border-surface-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-typography-main">
                    <span>
                      {p.fromStage} $\to$ {p.toStage}
                    </span>
                    <span className="text-[10px] text-typography-secondary">
                      {new Date(p.promotedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {p.remarks && (
                    <p className="text-[11px] text-typography-secondary">{p.remarks}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unit Transfer History */}
        <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-typography-main flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-red" />
            <span>Unit Transfer History</span>
          </h2>

          {transfers.length === 0 ? (
            <p className="text-xs text-typography-secondary italic py-2">
              No unit transfers recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {transfers.map((t: any) => (
                <div key={t._id} className="rounded-lg border border-surface-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-typography-main">
                    <span>
                      {t.fromUnitId?.name} $\to$ {t.toUnitId?.name}
                    </span>
                    <span className="text-[10px] text-typography-secondary">
                      {new Date(t.transferredAt).toLocaleDateString()}
                    </span>
                  </div>
                  {t.remarks && (
                    <p className="text-[11px] text-typography-secondary">{t.remarks}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
