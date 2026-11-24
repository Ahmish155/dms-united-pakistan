import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  CalendarDays,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { PersonStage, WorkspaceRole } from '@dms/shared';

export const RmmPage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();
  const [rmmList, setRmmList] = useState<any[]>([]);
  const [selectedRmmId, setSelectedRmmId] = useState<string | null>(null);
  const [selectedRmmProgress, setSelectedRmmProgress] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Create RMM Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Edit RMM Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRmmDate, setEditRmmDate] = useState('');
  const [editWeekStartDate, setEditWeekStartDate] = useState('');
  const [editWeekEndDate, setEditWeekEndDate] = useState('');
  const [editPlannedMadu, setEditPlannedMadu] = useState<number>(0);
  const [editPlannedMdf, setEditPlannedMdf] = useState<number>(0);
  const [editComments, setEditComments] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  const [modalUnitId, setModalUnitId] = useState('');
  const [rmmDate, setRmmDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekStartDate, setWeekStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekEndDate, setWeekEndDate] = useState(
    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [plannedMaduMeetings, setPlannedMaduMeetings] = useState<number>(0);
  const [plannedMdfMeetings, setPlannedMdfMeetings] = useState<number>(0);
  const [comments, setComments] = useState('');

  // Target entries builder inside modal
  const [targets, setTargets] = useState<
    Array<{
      personId: string;
      category: PersonStage;
      nextWeekTarget: number;
      expectedDay?: string;
    }>
  >([]);

  const [targetPersonId, setTargetPersonId] = useState('');
  const [targetCount, setTargetCount] = useState<number>(2);
  const [targetExpectedDay, setTargetExpectedDay] = useState('');

  const fetchRmmList = async () => {
    try {
      setLoading(true);
      const list = await ApiService.get<any[]>('/rmm');
      setRmmList(list);

      if (list.length > 0 && !selectedRmmId) {
        setSelectedRmmId(list[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to load RMM list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRmmProgress = async (id: string) => {
    try {
      const data = await ApiService.get<any>(`/rmm/${id}/progress`);
      setSelectedRmmProgress(data);
    } catch (err: any) {
      console.error('Failed to load RMM progress:', err);
    }
  };

  const fetchPrerequisites = async () => {
    try {
      const [unitsData, peopleData] = await Promise.all([
        ApiService.get<any[]>('/units'),
        ApiService.get<any[]>('/people')
      ]);
      setUnits(unitsData);
      setPeople(peopleData);
      if (unitsData.length > 0) setModalUnitId(unitsData[0]._id);
    } catch (err: any) {
      console.error('Failed to load prerequisites:', err);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchRmmList();
      fetchPrerequisites();
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (selectedRmmId) {
      fetchRmmProgress(selectedRmmId);
    }
  }, [selectedRmmId]);

  const handleAddTargetItem = () => {
    if (!targetPersonId) return;
    const p = people.find((x) => x._id === targetPersonId);
    if (!p) return;

    setTargets([
      ...targets,
      {
        personId: targetPersonId,
        category: p.currentStage || PersonStage.MADU,
        nextWeekTarget: targetCount,
        expectedDay: targetExpectedDay || undefined
      }
    ]);

    setTargetPersonId('');
    setTargetExpectedDay('');
  };

  const handleCreateRmm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plannedMaduMeetings === 0 && plannedMdfMeetings === 0 && targets.length === 0) {
      alert('Please enter planned meetings for the week or add targets.');
      return;
    }

    try {
      const created = await ApiService.post('/rmm', {
        unitId: modalUnitId,
        rmmDate,
        weekStartDate,
        weekEndDate,
        plannedMaduMeetings: Number(plannedMaduMeetings) || 0,
        plannedMdfMeetings: Number(plannedMdfMeetings) || 0,
        comments: comments || undefined,
        targets
      });

      setCreateModalOpen(false);
      setTargets([]);
      setPlannedMaduMeetings(0);
      setPlannedMdfMeetings(0);
      setComments('');
      await fetchRmmList();
      setSelectedRmmId(created.rmm._id);
    } catch (err: any) {
      alert(err.message || 'Failed to create RMM');
    }
  };

  const openEditRmm = () => {
    if (!selectedRmmProgress?.rmm) return;
    const r = selectedRmmProgress.rmm;
    setEditRmmDate(r.rmmDate ? r.rmmDate.split('T')[0] : '');
    setEditWeekStartDate(r.weekStartDate ? r.weekStartDate.split('T')[0] : '');
    setEditWeekEndDate(r.weekEndDate ? r.weekEndDate.split('T')[0] : '');
    setEditPlannedMadu(r.plannedMaduMeetings || 0);
    setEditPlannedMdf(r.plannedMdfMeetings || 0);
    setEditComments(r.comments || '');
    setEditModalOpen(true);
  };

  const handleUpdateRmm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRmmId) return;
    try {
      setSavingEdit(true);
      await ApiService.patch(`/rmm/${selectedRmmId}`, {
        rmmDate: editRmmDate,
        weekStartDate: editWeekStartDate,
        weekEndDate: editWeekEndDate,
        plannedMaduMeetings: Number(editPlannedMadu),
        plannedMdfMeetings: Number(editPlannedMdf),
        comments: editComments || undefined
      });
      setEditModalOpen(false);
      await fetchRmmProgress(selectedRmmId);
      await fetchRmmList();
    } catch (err: any) {
      alert(err.message || 'Failed to update RMM');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRmm = async () => {
    if (!selectedRmmId) return;
    try {
      await ApiService.delete(`/rmm/${selectedRmmId}`);
      setDeleteConfirm(false);
      setSelectedRmmId(null);
      setSelectedRmmProgress(null);
      await fetchRmmList();
    } catch (err: any) {
      alert(err.message || 'Failed to delete RMM');
    }
  };

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            RMM: Weekly Unit Planning
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Unit-level weekly meeting planning and live progress tracking for {activeWorkspace?.name}
          </p>
        </div>

        {isSecretary && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary gap-1.5 text-xs py-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Weekly RMM</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-typography-secondary">
          Loading RMM plans...
        </div>
      ) : rmmList.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-white p-8 text-center space-y-3">
          <CalendarDays className="mx-auto h-8 w-8 text-typography-muted" />
          <h3 className="text-sm font-semibold text-typography-main">No RMM Records Yet</h3>
          <p className="text-xs text-typography-secondary max-w-sm mx-auto">
            Units conduct weekly RMM meetings to plan upcoming individual meetings. Click Create Weekly RMM to log one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: RMM Sessions List */}
          <div className="space-y-3">
            <h2 className="font-bold text-xs uppercase tracking-wider text-typography-secondary">
              Recent RMM Sessions
            </h2>
            <div className="space-y-2">
              {rmmList.map((rmm) => {
                const isSelected = rmm._id === selectedRmmId;
                return (
                  <button
                    key={rmm._id}
                    onClick={() => setSelectedRmmId(rmm._id)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-brand-red bg-white shadow-sm ring-1 ring-brand-red'
                        : 'border-surface-border bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-typography-main">
                        Unit {rmm.unitId?.name}
                      </span>
                      <span className="text-[10px] text-typography-secondary font-mono">
                        {new Date(rmm.rmmDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-typography-secondary flex items-center gap-1">
                      <Clock className="h-3 w-3 text-typography-muted" />
                      <span>
                        {new Date(rmm.weekStartDate).toLocaleDateString()} –{' '}
                        {new Date(rmm.weekEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected RMM Progress Details */}
          <div className="lg:col-span-2 space-y-5">
            {selectedRmmProgress ? (
              <div className="space-y-5">
                {/* Session Header & Edit Actions */}
                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-surface-border">
                  <div>
                    <h3 className="font-bold text-sm text-typography-main">
                      Unit {selectedRmmProgress.rmm?.unitId?.name} — Weekly Session
                    </h3>
                    <p className="text-xs text-typography-secondary">
                      Window: {new Date(selectedRmmProgress.rmm?.weekStartDate).toLocaleDateString()} to {new Date(selectedRmmProgress.rmm?.weekEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  {isSecretary && (
                    <div className="flex gap-2">
                      <button
                        onClick={openEditRmm}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit RMM
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="rounded border border-red-200 text-status-error hover:bg-red-50 text-xs py-1.5 px-3 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-surface-border bg-white p-3.5 shadow-sm">
                    <span className="text-[11px] font-semibold text-typography-secondary uppercase">
                      Planned Madu
                    </span>
                    <div className="text-xl font-bold text-typography-main mt-0.5">
                      {selectedRmmProgress.summary.totalPlannedMadu}
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-border bg-white p-3.5 shadow-sm">
                    <span className="text-[11px] font-semibold text-typography-secondary uppercase">
                      Planned MDF
                    </span>
                    <div className="text-xl font-bold text-typography-main mt-0.5">
                      {selectedRmmProgress.summary.totalPlannedMdf}
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-border bg-white p-3.5 shadow-sm">
                    <span className="text-[11px] font-semibold text-typography-secondary uppercase">
                      Actual Completed
                    </span>
                    <div className="text-xl font-bold text-brand-red mt-0.5">
                      {selectedRmmProgress.summary.totalActualCompleted}
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-border bg-white p-3.5 shadow-sm">
                    <span className="text-[11px] font-semibold text-typography-secondary uppercase">
                      Progress
                    </span>
                    <div className="text-xl font-bold text-status-success mt-0.5">
                      {selectedRmmProgress.summary.overallCompletionPercentage}%
                    </div>
                  </div>
                </div>

                {/* Targets Table */}
                <div className="rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden">
                  <div className="p-3.5 bg-surface-secondary/70 border-b border-surface-border flex items-center justify-between">
                    <span className="font-bold text-xs text-typography-main">
                      Individual Next-Week Targets
                    </span>
                    <span className="text-xs text-typography-secondary">
                      {selectedRmmProgress.targets.length} targets planned
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-typography-secondary border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Person</th>
                          <th className="p-2.5">Target</th>
                          <th className="p-2.5">Actual IM</th>
                          <th className="p-2.5">Remaining</th>
                          <th className="p-2.5">Completion</th>
                          <th className="p-2.5">Expected Day</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {selectedRmmProgress.targets.map((t: any) => (
                          <tr key={t._id} className="hover:bg-gray-50">
                            <td className="p-2.5">
                              <span className="rounded bg-brand-red-light px-1.5 py-0.5 text-[10px] font-semibold text-brand-red">
                                {t.category}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-typography-main">
                              {t.personId?.fullName}
                            </td>
                            <td className="p-2.5 font-semibold text-center">
                              {t.nextWeekTarget}
                            </td>
                            <td className="p-2.5 font-bold text-center text-brand-red">
                              {t.actualMeetings}
                            </td>
                            <td className="p-2.5 text-center text-typography-secondary">
                              {t.remainingMeetings}
                            </td>
                            <td className="p-2.5 font-semibold text-center">
                              {t.completionPercentage}%
                            </td>
                            <td className="p-2.5 text-typography-secondary">
                              {t.expectedDay || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-typography-secondary">
                Select an RMM session on the left to inspect its progress.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create RMM Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-surface-border bg-white p-6 shadow-xl my-8 space-y-4">
            <h3 className="font-bold text-base text-typography-main">Create Weekly RMM Plan</h3>
            <p className="text-xs text-typography-secondary">
              Record the weekly meeting planning session and set upcoming targets.
            </p>

            <form onSubmit={handleCreateRmm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Unit *
                </label>
                <select
                  required
                  value={modalUnitId}
                  onChange={(e) => setModalUnitId(e.target.value)}
                  className="input-field text-xs"
                >
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-typography-main mb-1">
                    RMM Date
                  </label>
                  <input
                    type="date"
                    required
                    value={rmmDate}
                    onChange={(e) => setRmmDate(e.target.value)}
                    className="input-field text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-typography-main mb-1">
                    Week Start
                  </label>
                  <input
                    type="date"
                    required
                    value={weekStartDate}
                    onChange={(e) => setWeekStartDate(e.target.value)}
                    className="input-field text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-typography-main mb-1">
                    Week End
                  </label>
                  <input
                    type="date"
                    required
                    value={weekEndDate}
                    onChange={(e) => setWeekEndDate(e.target.value)}
                    className="input-field text-xs py-1.5"
                  />
                </div>
              </div>

              {/* Aggregate Target Inputs (Simplified RMM Planning) */}
              <div className="rounded-lg border border-surface-border bg-surface-secondary/40 p-3 space-y-3">
                <span className="font-semibold text-xs text-typography-main block">
                  Weekly Meeting Targets Set For Unit:
                </span>
                <p className="text-[11px] text-typography-secondary">
                  Specify how many total meetings are planned for this week. Analytics will automatically track actual meetings held by the end of the week.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-typography-main mb-1">
                      Planned Madu Meetings
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={plannedMaduMeetings}
                      onChange={(e) => setPlannedMaduMeetings(parseInt(e.target.value, 10) || 0)}
                      className="input-field text-xs py-1.5"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-typography-main mb-1">
                      Planned MDF Meetings
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={plannedMdfMeetings}
                      onChange={(e) => setPlannedMdfMeetings(parseInt(e.target.value, 10) || 0)}
                      className="input-field text-xs py-1.5"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              </div>

              {/* Optional: Add Target Item Sub-form */}
              <div className="rounded-lg border border-surface-border bg-surface-secondary/20 p-3 space-y-2">
                <span className="font-semibold text-xs text-typography-secondary block">
                  Optional: Specific Person Targets (If Desired)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={targetPersonId}
                    onChange={(e) => setTargetPersonId(e.target.value)}
                    className="input-field text-xs py-1"
                  >
                    <option value="">Select Person</option>
                    {people
                      .filter((p) => p.currentUnitId?._id === modalUnitId)
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.fullName} ({p.currentStage})
                        </option>
                      ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
                    placeholder="Target IMs"
                    className="input-field text-xs py-1"
                  />

                  <input
                    type="text"
                    value={targetExpectedDay}
                    onChange={(e) => setTargetExpectedDay(e.target.value)}
                    placeholder="Day (e.g. Tuesday)"
                    className="input-field text-xs py-1"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddTargetItem}
                  className="btn-secondary text-xs py-1 px-3 text-brand-red font-semibold"
                >
                  + Add to Target List
                </button>
              </div>

              {/* Staged Targets Preview */}
              {targets.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-typography-secondary block">
                    Planned Targets ({targets.length}):
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1 border border-surface-border rounded-lg p-2 bg-white">
                    {targets.map((t, idx) => {
                      const p = people.find((x) => x._id === t.personId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-0.5 border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium text-typography-main">
                            {p?.fullName} ({t.category})
                          </span>
                          <span className="text-typography-secondary">
                            {t.nextWeekTarget} IMs {t.expectedDay ? `on ${t.expectedDay}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2"
                >
                  Save Weekly RMM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit RMM Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-6 shadow-xl my-8 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-typography-main">Edit Weekly RMM</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-typography-muted hover:text-typography-main">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRmm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">RMM Meeting Date</label>
                <input
                  type="date"
                  required
                  value={editRmmDate}
                  onChange={(e) => setEditRmmDate(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">Week Start</label>
                  <input
                    type="date"
                    required
                    value={editWeekStartDate}
                    onChange={(e) => setEditWeekStartDate(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">Week End</label>
                  <input
                    type="date"
                    required
                    value={editWeekEndDate}
                    onChange={(e) => setEditWeekEndDate(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">Planned Madu IMs</label>
                  <input
                    type="number"
                    min="0"
                    value={editPlannedMadu}
                    onChange={(e) => setEditPlannedMadu(parseInt(e.target.value, 10) || 0)}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">Planned MDF IMs</label>
                  <input
                    type="number"
                    min="0"
                    value={editPlannedMdf}
                    onChange={(e) => setEditPlannedMdf(parseInt(e.target.value, 10) || 0)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Comments / Notes</label>
                <textarea
                  rows={2}
                  value={editComments}
                  onChange={(e) => setEditComments(e.target.value)}
                  className="input-field text-xs resize-none"
                  placeholder="Notes on weekly targets..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary text-xs py-2"
                >
                  {savingEdit ? 'Saving...' : 'Update RMM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-xl bg-white shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-status-error" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-typography-main">Delete Weekly RMM</h3>
                <p className="text-xs text-typography-secondary">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-typography-main">
              Are you sure you want to delete this RMM session and its associated targets?
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-xs py-1.5 px-3">
                Cancel
              </button>
              <button
                onClick={handleDeleteRmm}
                className="text-xs py-1.5 px-4 rounded-lg bg-status-error text-white hover:opacity-90 font-semibold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
