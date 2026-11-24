import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  MessageSquare,
  Users,
  Plus,
  Calendar,
  Building2,
  CheckCircle2,
  Award,
  Shield,
  Clock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { ParticipantCategory, WorkspaceRole } from '@dms/shared';

export const ActivitiesPage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'DF' | 'GM' | 'MENTORS'>('DF');

  const [dfList, setDfList] = useState<any[]>([]);
  const [gmList, setGmList] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [recordDfOpen, setRecordDfOpen] = useState(false);
  const [recordGmOpen, setRecordGmOpen] = useState(false);
  const [addMentorOpen, setAddMentorOpen] = useState(false);

  // Record DF Form
  const [dfUnitId, setDfUnitId] = useState('');
  const [dfDate, setDfDate] = useState(new Date().toISOString().split('T')[0]);
  const [dfMentorId, setDfMentorId] = useState('');
  const [dfTopic, setDfTopic] = useState('');
  const [dfComments, setDfComments] = useState('');
  const [dfAttendees, setDfAttendees] = useState<string[]>([]);

  // Record GM Form
  const [gmUnitId, setGmUnitId] = useState('');
  const [gmDate, setGmDate] = useState(new Date().toISOString().split('T')[0]);
  const [gmFacilitatorId, setGmFacilitatorId] = useState('');
  const [gmTopic, setGmTopic] = useState('');
  const [gmComments, setGmComments] = useState('');
  const [gmAttendees, setGmAttendees] = useState<string[]>([]);

  // Add Mentor Form
  const [mentorName, setMentorName] = useState('');
  const [mentorSpecialization, setMentorSpecialization] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'DF' | 'GM'; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dfs, gms, mtrs, unts, ppl] = await Promise.all([
        ApiService.get<any[]>('/df'),
        ApiService.get<any[]>('/gm'),
        ApiService.get<any[]>('/df/mentors'),
        ApiService.get<any[]>('/units'),
        ApiService.get<any[]>('/people')
      ]);

      setDfList(dfs);
      setGmList(gms);
      setMentors(mtrs);
      setUnits(unts);
      setPeople(ppl);

      if (unts.length > 0) {
        setDfUnitId(unts[0]._id);
        setGmUnitId(unts[0]._id);
      }
      if (mtrs.length > 0) {
        setDfMentorId(mtrs[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchData();
    }
  }, [activeWorkspace]);

  const handleRecordDf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const participants = dfAttendees.map((pid) => {
        const p = people.find((x) => x._id === pid);
        return {
          personId: pid,
          category: (p?.currentStage as any) || ParticipantCategory.OTHER,
          status: 'ATTENDED' as const
        };
      });

      await ApiService.post('/df', {
        unitId: dfUnitId,
        date: new Date(dfDate).toISOString(),
        mentorId: dfMentorId,
        topic: dfTopic || undefined,
        comments: dfComments || undefined,
        participants
      });

      setRecordDfOpen(false);
      setDfTopic('');
      setDfComments('');
      setDfAttendees([]);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record Dialogue Forum');
    }
  };

  const handleRecordGm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const participants = gmAttendees.map((pid) => {
        const p = people.find((x) => x._id === pid);
        return {
          personId: pid,
          category: (p?.currentStage as any) || ParticipantCategory.OTHER,
          status: 'ATTENDED' as const
        };
      });

      await ApiService.post('/gm', {
        unitId: gmUnitId,
        date: new Date(gmDate).toISOString(),
        facilitatorPersonId: gmFacilitatorId || undefined,
        topic: gmTopic || undefined,
        comments: gmComments || undefined,
        participants
      });

      setRecordGmOpen(false);
      setGmTopic('');
      setGmComments('');
      setGmAttendees([]);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record Group Meeting');
    }
  };

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.post('/df/mentors', {
        name: mentorName,
        specialization: mentorSpecialization || undefined
      });
      setAddMentorOpen(false);
      setMentorName('');
      setMentorSpecialization('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add mentor');
    }
  };

  const toggleAttendee = (
    id: string,
    list: string[],
    setList: (val: string[]) => void
  ) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
    } else {
      setList([...list, id]);
    }
  };

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  const handleDeleteActivity = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const endpoint = deleteTarget.type === 'DF' ? `/df/${deleteTarget.id}` : `/gm/${deleteTarget.id}`;
      await ApiService.delete(endpoint);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
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
            Activities: DF & Group Meetings
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Dialogue Forums, Group Meetings, and Mentors Directory for {activeWorkspace?.name}
          </p>
        </div>

        {isSecretary && (
          <div className="flex items-center gap-2">
            {activeTab === 'DF' && (
              <button
                onClick={() => setRecordDfOpen(true)}
                className="btn-primary gap-1.5 text-xs py-2"
              >
                <Plus className="h-4 w-4" />
                <span>Record DF</span>
              </button>
            )}
            {activeTab === 'GM' && (
              <button
                onClick={() => setRecordGmOpen(true)}
                className="btn-primary gap-1.5 text-xs py-2"
              >
                <Plus className="h-4 w-4" />
                <span>Record GM</span>
              </button>
            )}
            {activeTab === 'MENTORS' && (
              <button
                onClick={() => setAddMentorOpen(true)}
                className="btn-primary gap-1.5 text-xs py-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Mentor</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border gap-2 text-xs">
        <button
          onClick={() => setActiveTab('DF')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'DF'
              ? 'border-brand-red text-brand-red font-bold'
              : 'border-transparent text-typography-secondary hover:text-typography-main'
          }`}
        >
          Dialogue Forums ({dfList.length})
        </button>

        <button
          onClick={() => setActiveTab('GM')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'GM'
              ? 'border-brand-red text-brand-red font-bold'
              : 'border-transparent text-typography-secondary hover:text-typography-main'
          }`}
        >
          Group Meetings ({gmList.length})
        </button>

        <button
          onClick={() => setActiveTab('MENTORS')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'MENTORS'
              ? 'border-brand-red text-brand-red font-bold'
              : 'border-transparent text-typography-secondary hover:text-typography-main'
          }`}
        >
          DF Mentors ({mentors.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-xs text-typography-secondary">
          Loading activities...
        </div>
      ) : activeTab === 'DF' ? (
        dfList.length === 0 ? (
          <div className="rounded-xl border border-surface-border bg-white p-8 text-center space-y-2">
            <MessageSquare className="mx-auto h-8 w-8 text-typography-muted" />
            <h3 className="text-sm font-semibold text-typography-main">No Dialogue Forums Recorded</h3>
            <p className="text-xs text-typography-secondary">
              Record unit-level Dialogue Forums and mark participant attendance.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dfList.map((df) => (
              <div
                key={df._id}
                className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-typography-main">
                      {df.topic || 'Dialogue Forum'}
                    </h3>
                    <div className="text-[11px] text-typography-secondary mt-0.5 flex items-center gap-1.5">
                      <span>{new Date(df.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{df.unitId?.name}</span>
                    </div>
                  </div>
                  <span className="badge-active text-[10px]">
                    {df.attendance?.length || 0} Attended
                  </span>
                </div>

                <div className="border-t border-surface-border pt-2 text-xs space-y-1">
                  <div className="flex justify-between text-typography-secondary">
                    <span>Mentor:</span>
                    <span className="font-semibold text-typography-main">
                      {df.mentorId?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Attendees Roster */}
                {df.attendance && df.attendance.length > 0 && (
                  <div className="pt-2 border-t border-surface-border">
                    <span className="text-[10px] font-semibold text-typography-secondary uppercase block mb-1">
                      Participants:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {df.attendance.map((a: any) => (
                        <span
                          key={a._id}
                          className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] text-typography-main"
                        >
                          {a.personId?.fullName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                {isSecretary && (
                  <div className="pt-2 border-t border-surface-border flex justify-end">
                    <button
                      onClick={() => setDeleteTarget({ id: df._id, type: 'DF', label: df.topic || 'Dialogue Forum' })}
                      className="text-[10px] text-status-error hover:bg-red-50 rounded px-2 py-1 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'GM' ? (
        gmList.length === 0 ? (
          <div className="rounded-xl border border-surface-border bg-white p-8 text-center space-y-2">
            <Users className="mx-auto h-8 w-8 text-typography-muted" />
            <h3 className="text-sm font-semibold text-typography-main">No Group Meetings Recorded</h3>
            <p className="text-xs text-typography-secondary">
              Record unit group meetings and track separate participation analytics.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gmList.map((gm) => (
              <div
                key={gm._id}
                className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-typography-main">
                      {gm.topic || 'Group Meeting'}
                    </h3>
                    <div className="text-[11px] text-typography-secondary mt-0.5 flex items-center gap-1.5">
                      <span>{new Date(gm.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{gm.unitId?.name}</span>
                    </div>
                  </div>
                  <span className="badge-active text-[10px]">
                    {gm.attendance?.length || 0} Attended
                  </span>
                </div>

                <div className="border-t border-surface-border pt-2 text-xs space-y-1">
                  <div className="flex justify-between text-typography-secondary">
                    <span>Facilitator:</span>
                    <span className="font-semibold text-typography-main">
                      {gm.facilitatorPersonId?.fullName || 'None'}
                    </span>
                  </div>
                </div>

                {gm.attendance && gm.attendance.length > 0 && (
                  <div className="pt-2 border-t border-surface-border">
                    <span className="text-[10px] font-semibold text-typography-secondary uppercase block mb-1">
                      Participants:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {gm.attendance.map((a: any) => (
                        <span
                          key={a._id}
                          className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] text-typography-main"
                        >
                          {a.personId?.fullName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                {isSecretary && (
                  <div className="pt-2 border-t border-surface-border flex justify-end">
                    <button
                      onClick={() => setDeleteTarget({ id: gm._id, type: 'GM', label: gm.topic || 'Group Meeting' })}
                      className="text-[10px] text-status-error hover:bg-red-50 rounded px-2 py-1 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Mentors Directory */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mentors.map((m) => (
            <div
              key={m._id}
              className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-red" />
                <h3 className="font-bold text-sm text-typography-main">{m.name}</h3>
              </div>
              <p className="text-xs text-typography-secondary">
                {m.specialization || 'Dawati Mentor'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Record DF Modal */}
      {recordDfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-6 shadow-xl my-8 space-y-4">
            <h3 className="font-bold text-base text-typography-main">Record Dialogue Forum</h3>

            <form onSubmit={handleRecordDf} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Unit *
                </label>
                <select
                  required
                  value={dfUnitId}
                  onChange={(e) => setDfUnitId(e.target.value)}
                  className="input-field text-xs"
                >
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dfDate}
                    onChange={(e) => setDfDate(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Mentor *
                  </label>
                  <select
                    required
                    value={dfMentorId}
                    onChange={(e) => setDfMentorId(e.target.value)}
                    className="input-field text-xs"
                  >
                    {mentors.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Topic (Optional)
                </label>
                <input
                  type="text"
                  value={dfTopic}
                  onChange={(e) => setDfTopic(e.target.value)}
                  placeholder="e.g. Dialogue Forum on Leadership"
                  className="input-field text-xs"
                />
              </div>

              {/* Attendance Checklist */}
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Mark Participants Attended:
                </label>
                <div className="max-h-40 overflow-y-auto border border-surface-border rounded-lg p-2 space-y-1 bg-surface-secondary/30">
                  {people.map((p) => {
                    const isAttended = dfAttendees.includes(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => toggleAttendee(p._id, dfAttendees, setDfAttendees)}
                        className={`flex w-full items-center justify-between p-1.5 rounded text-xs transition-colors ${
                          isAttended
                            ? 'bg-brand-red text-white font-semibold'
                            : 'hover:bg-white text-typography-main'
                        }`}
                      >
                        <span>
                          {p.fullName} ({p.currentStage})
                        </span>
                        {isAttended && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setRecordDfOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2">
                  Save DF Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record GM Modal */}
      {recordGmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-6 shadow-xl my-8 space-y-4">
            <h3 className="font-bold text-base text-typography-main">Record Group Meeting</h3>

            <form onSubmit={handleRecordGm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Unit *
                </label>
                <select
                  required
                  value={gmUnitId}
                  onChange={(e) => setGmUnitId(e.target.value)}
                  className="input-field text-xs"
                >
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={gmDate}
                    onChange={(e) => setGmDate(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Facilitator
                  </label>
                  <select
                    value={gmFacilitatorId}
                    onChange={(e) => setGmFacilitatorId(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="">-- None --</option>
                    {people.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Topic (Optional)
                </label>
                <input
                  type="text"
                  value={gmTopic}
                  onChange={(e) => setGmTopic(e.target.value)}
                  placeholder="e.g. Group Discussion on Current Affairs"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Mark Participants Attended:
                </label>
                <div className="max-h-40 overflow-y-auto border border-surface-border rounded-lg p-2 space-y-1 bg-surface-secondary/30">
                  {people.map((p) => {
                    const isAttended = gmAttendees.includes(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => toggleAttendee(p._id, gmAttendees, setGmAttendees)}
                        className={`flex w-full items-center justify-between p-1.5 rounded text-xs transition-colors ${
                          isAttended
                            ? 'bg-brand-red text-white font-semibold'
                            : 'hover:bg-white text-typography-main'
                        }`}
                      >
                        <span>
                          {p.fullName} ({p.currentStage})
                        </span>
                        {isAttended && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setRecordGmOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2">
                  Save GM Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mentor Modal */}
      {addMentorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-surface-border bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-typography-main">Add DF Mentor</h3>

            <form onSubmit={handleAddMentor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Mentor Name *
                </label>
                <input
                  type="text"
                  required
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  placeholder="e.g. Mentor Haroon"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Specialization (Optional)
                </label>
                <input
                  type="text"
                  value={mentorSpecialization}
                  onChange={(e) => setMentorSpecialization(e.target.value)}
                  placeholder="e.g. Dawati Speaker / Political Science"
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setAddMentorOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2">
                  Save Mentor
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
                <h3 className="text-sm font-bold text-typography-main">
                  Delete {deleteTarget.type === 'DF' ? 'Dialogue Forum' : 'Group Meeting'}
                </h3>
                <p className="text-xs text-typography-secondary">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-typography-main">
              Delete <strong>"{deleteTarget.label}"</strong>? All attendance records will also be removed.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-xs py-1.5 px-3" disabled={deleting}>
                Cancel
              </button>
              <button
                onClick={handleDeleteActivity}
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
