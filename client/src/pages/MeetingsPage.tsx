import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  CalendarCheck,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle
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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedUnitId) params.append('unitId', selectedUnitId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const query = params.toString() ? `?${params.toString()}` : '';

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
    if (activeWorkspace) fetchMeetings();
  }, [activeWorkspace, selectedUnitId, startDate, endDate]);

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  const startEdit = (m: any) => {
    setEditingId(m._id);
    setEditForm({
      meetingDate: m.meetingDate ? m.meetingDate.substring(0, 10) : '',
      comments: m.comments || ''
    });
  };

  const handleSave = async (id: string) => {
    try {
      setSaving(true);
      await ApiService.patch(`/meetings/${id}`, editForm);
      setEditingId(null);
      await fetchMeetings();
    } catch (err: any) {
      alert(err.message || 'Failed to update meeting');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await ApiService.delete(`/meetings/${deleteTarget._id}`);
      setDeleteTarget(null);
      await fetchMeetings();
    } catch (err: any) {
      alert(err.message || 'Failed to delete meeting');
    } finally {
      setDeleting(false);
    }
  };

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
          <label className="block text-[11px] font-semibold text-typography-secondary mb-1">Filter by Unit</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="input-field text-xs py-1.5"
          >
            <option value="">All Units</option>
            {units.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-typography-secondary mb-1">From Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field text-xs py-1.5" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-typography-secondary mb-1">To Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field text-xs py-1.5" />
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-typography-secondary">Loading meetings...</div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-white p-8 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-typography-muted" />
          <h3 className="mt-2 text-sm font-semibold text-typography-main">No Meetings Recorded</h3>
          <p className="mt-1 text-xs text-typography-secondary">
            Use the Record Meeting action to log newly completed meetings.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-white shadow-sm">
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
                {isSecretary && <th className="p-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {meetings.map((m) => {
                const isEditing = editingId === m._id;
                return (
                  <tr key={m._id} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="p-3 font-medium whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.meetingDate}
                          onChange={(e) => setEditForm((p: any) => ({ ...p, meetingDate: e.target.value }))}
                          className="input-field text-xs py-1 w-32"
                        />
                      ) : (
                        new Date(m.meetingDate).toLocaleDateString()
                      )}
                    </td>
                    <td className="p-3 font-bold text-typography-main">
                      <Link to={`/people/${m.personId?._id}`} className="hover:text-brand-red transition-colors">
                        {m.personId?.fullName}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-brand-red-light px-1.5 py-0.5 text-[10px] font-semibold text-brand-red">
                        {m.personStageAtMeeting || m.personStageAtTime}
                      </span>
                    </td>
                    <td className="p-3">{m.unitId?.name}</td>
                    <td className="p-3 font-semibold">#{m.meetingNumber}</td>
                    <td className="p-3">{m.primaryDaeenId?.fullName || '—'}</td>
                    <td className="p-3 text-typography-secondary">{m.rabtakarId?.fullName || '—'}</td>
                    <td className="p-3 text-typography-secondary max-w-xs truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.comments}
                          onChange={(e) => setEditForm((p: any) => ({ ...p, comments: e.target.value }))}
                          className="input-field text-xs py-1 w-40"
                          placeholder="Comments…"
                        />
                      ) : (
                        m.comments || '—'
                      )}
                    </td>
                    {isSecretary && (
                      <td className="p-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSave(m._id)}
                              disabled={saving}
                              className="rounded bg-brand-red text-white px-2 py-1 text-[10px] font-semibold hover:opacity-90"
                            >
                              <Save className="h-3 w-3 inline" /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded bg-gray-100 text-typography-secondary px-2 py-1 text-[10px]"
                            >
                              <X className="h-3 w-3 inline" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(m)}
                              className="rounded bg-surface-secondary px-2 py-1 text-[10px] text-typography-main hover:bg-gray-200"
                            >
                              <Edit2 className="h-3 w-3 inline" /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(m)}
                              className="rounded bg-red-50 text-status-error px-2 py-1 text-[10px] hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3 inline" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-xl bg-white shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-status-error" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-typography-main">Delete Meeting</h3>
                <p className="text-xs text-typography-secondary">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-typography-main">
              Delete meeting <strong>#{deleteTarget.meetingNumber}</strong> for <strong>{deleteTarget.personId?.fullName}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-xs py-1.5 px-3" disabled={deleting}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs py-1.5 px-4 rounded-lg bg-status-error text-white hover:opacity-90 font-semibold transition-opacity"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
