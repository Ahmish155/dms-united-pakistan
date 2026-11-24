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
import { WorkspaceRole, PersonStage, OrganizationalResponsibility } from '@dms/shared';

export const MeetingsPage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit Modal State
  const [editMeetingTarget, setEditMeetingTarget] = useState<any | null>(null);
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

      const [meetingsData, unitsData, peopleData] = await Promise.all([
        ApiService.get<any[]>(`/meetings${query}`),
        ApiService.get<any[]>('/units'),
        ApiService.get<any[]>('/people')
      ]);

      setMeetings(meetingsData);
      setUnits(unitsData);
      setPeople(peopleData);
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
    setEditMeetingTarget(m);
    setEditForm({
      personId: m.personId?._id || m.personId || '',
      unitId: m.unitId?._id || m.unitId || '',
      meetingDate: m.meetingDate ? m.meetingDate.substring(0, 10) : '',
      meetingNumber: m.meetingNumber || 1,
      primaryDaeenId: m.primaryDaeenId?._id || m.primaryDaeenId || '',
      rabtakarId: m.rabtakarId?._id || m.rabtakarId || '',
      comments: m.comments || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeetingTarget) return;
    try {
      setSaving(true);
      await ApiService.patch(`/meetings/${editMeetingTarget._id}`, {
        personId: editForm.personId || undefined,
        unitId: editForm.unitId || undefined,
        meetingDate: new Date(editForm.meetingDate).toISOString(),
        meetingNumber: Number(editForm.meetingNumber),
        primaryDaeenId: editForm.primaryDaeenId || undefined,
        rabtakarId: editForm.rabtakarId || undefined,
        comments: editForm.comments || undefined
      });
      setEditMeetingTarget(null);
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

  const rabtakarList = people.filter(
    (p) => p.currentStage === PersonStage.RABTAKAR || p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
  );
  const daeenList = people.filter(
    (p) => p.currentStage === PersonStage.DAEEN || p.roles?.includes(OrganizationalResponsibility.DAEEN)
  );

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
                {isSecretary && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {meetings.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium whitespace-nowrap">
                    {new Date(m.meetingDate).toLocaleDateString()}
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
                  <td className="p-3 font-medium">{m.primaryDaeenId?.fullName || '—'}</td>
                  <td className="p-3 text-typography-secondary">{m.rabtakarId?.fullName || '—'}</td>
                  <td className="p-3 text-typography-secondary max-w-xs truncate">
                    {m.comments || '—'}
                  </td>
                  {isSecretary && (
                    <td className="p-3 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => startEdit(m)}
                          className="rounded border border-surface-border bg-white px-2 py-1 text-[10px] text-typography-main hover:bg-gray-100 flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="rounded bg-red-50 text-status-error px-2 py-1 text-[10px] hover:bg-red-100 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Edit Meeting Modal */}
      {editMeetingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-6 shadow-xl my-8 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-typography-main">Edit Individual Meeting</h3>
              <button onClick={() => setEditMeetingTarget(null)} className="text-typography-muted hover:text-typography-main">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Madu / MDF</label>
                <select
                  required
                  value={editForm.personId}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, personId: e.target.value }))}
                  className="input-field text-xs"
                >
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.currentStage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.meetingDate}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, meetingDate: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">Meeting Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.meetingNumber}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, meetingNumber: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Unit</label>
                <select
                  value={editForm.unitId}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, unitId: e.target.value }))}
                  className="input-field text-xs"
                >
                  <option value="">No Unit</option>
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Primary Daeen</label>
                <select
                  value={editForm.primaryDaeenId}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, primaryDaeenId: e.target.value }))}
                  className="input-field text-xs"
                >
                  <option value="">Select Daeen...</option>
                  {daeenList.map((d) => (
                    <option key={d._id} value={d._id}>{d.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Rabtakar</label>
                <select
                  value={editForm.rabtakarId}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, rabtakarId: e.target.value }))}
                  className="input-field text-xs"
                >
                  <option value="">Select Rabtakar...</option>
                  {rabtakarList.map((r) => (
                    <option key={r._id} value={r._id}>{r.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Comments / Notes</label>
                <textarea
                  rows={2}
                  value={editForm.comments}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, comments: e.target.value }))}
                  className="input-field text-xs resize-none"
                  placeholder="Meeting notes..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditMeetingTarget(null)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2"
                >
                  {saving ? 'Saving...' : 'Update Meeting'}
                </button>
              </div>
            </form>
          </div>
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
