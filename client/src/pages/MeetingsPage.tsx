import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  MapPin
} from 'lucide-react';
import { WorkspaceRole } from '@dms/shared';

export const MeetingsPage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      let query = '';
      const params = new URLSearchParams();
      if (selectedUnitId) params.append('unitId', selectedUnitId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) query = `?${params.toString()}`;

      const [meetingsData, unitsData] = await Promise.all([
        ApiService.get<any[]>(`/meetings${query}`),
        ApiService.get<any[]>('/units')
      ]);

      setMeetings(meetingsData);
      setUnits(unitsData);
    } catch (err: any) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchMeetings();
    }
  }, [activeWorkspace, selectedUnitId, startDate, endDate]);

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            Individual Meetings (IM)
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Log of completed individual meetings conducted in {activeWorkspace?.name}
          </p>
        </div>

        {isSecretary && (
          <Link
            to="/meetings/new"
            className="btn-primary gap-1.5 text-xs py-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Record Meeting</span>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-surface-border text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-typography-secondary mb-1">
            Filter by Unit
          </label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="input-field text-xs py-1.5"
          >
            <option value="">All Units</option>
            {units.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-typography-secondary mb-1">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field text-xs py-1.5"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-typography-secondary mb-1">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field text-xs py-1.5"
          />
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-typography-secondary">
          Loading meetings...
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-white p-8 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-typography-muted" />
          <h3 className="mt-2 text-sm font-semibold text-typography-main">No Meetings Recorded</h3>
          <p className="mt-1 text-xs text-typography-secondary">
            Use the Record Meeting action to log newly completed meetings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden md:block overflow-x-auto rounded-xl border border-surface-border bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-typography-secondary border-b border-surface-border">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Person</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Meeting #</th>
                  <th className="p-3">Primary Daeen</th>
                  <th className="p-3">Rabtakar</th>
                  <th className="p-3">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {meetings.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium whitespace-nowrap">
                      {new Date(m.meetingDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-bold text-typography-main">
                      <Link
                        to={`/people/${m.personId?._id}`}
                        className="hover:text-brand-red transition-colors"
                      >
                        {m.personId?.fullName}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-brand-red-light px-1.5 py-0.5 text-[10px] font-semibold text-brand-red">
                        {m.personStageAtTime}
                      </span>
                    </td>
                    <td className="p-3">{m.unitId?.name}</td>
                    <td className="p-3 font-semibold">#{m.meetingNumber}</td>
                    <td className="p-3">{m.primaryDaeenId?.fullName}</td>
                    <td className="p-3 text-typography-secondary">
                      {m.rabtakarId?.fullName}
                    </td>
                    <td className="p-3 text-typography-secondary max-w-xs truncate">
                      {m.comments || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (Part 14.4) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {meetings.map((m) => (
              <div
                key={m._id}
                className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/people/${m.personId?._id}`}
                      className="font-bold text-sm text-typography-main hover:text-brand-red"
                    >
                      {m.personId?.fullName}
                    </Link>
                    <div className="text-[11px] text-typography-secondary mt-0.5 flex items-center gap-1.5">
                      <span>{new Date(m.meetingDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{m.unitId?.name}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-typography-main">
                    #{m.meetingNumber}
                  </span>
                </div>

                <div className="border-t border-surface-border pt-2 text-[11px] text-typography-secondary space-y-1">
                  <div className="flex justify-between">
                    <span>Daeen:</span>
                    <span className="font-medium text-typography-main">
                      {m.primaryDaeenId?.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rabtakar:</span>
                    <span className="font-medium text-typography-main">
                      {m.rabtakarId?.fullName}
                    </span>
                  </div>
                  {m.comments && (
                    <p className="mt-1 bg-surface-secondary p-2 rounded text-[11px] text-typography-main">
                      "{m.comments}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
