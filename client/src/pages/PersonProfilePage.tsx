import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  FileText,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { ActivityStatus, PersonStage, OrganizationalResponsibility } from '@dms/shared';

export const PersonProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [allPeople, setAllPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [res, unitsRes, peopleRes] = await Promise.all([
        ApiService.get<any>(`/people/${id}`),
        ApiService.get<any[]>('/units'),
        ApiService.get<any[]>('/people')
      ]);
      setData(res);
      setUnits(unitsRes);
      setAllPeople(peopleRes);
      // Pre-fill edit form
      setEditForm({
        fullName: res.person.fullName,
        contactNumber: res.person.contactNumber || '',
        currentStage: res.person.currentStage,
        currentUnitId: res.person.currentUnitId?._id || '',
        assignedUnitIds: res.person.assignedUnitIds?.map((u: any) => u._id || u) || [],
        roles: res.person.roles || [],
        primaryRabtakarId: res.person.primaryRabtakarId?._id || '',
        defaultDaeenId: res.person.defaultDaeenId?._id || '',
        notes: res.person.notes || ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: any = {
        fullName: editForm.fullName,
        contactNumber: editForm.contactNumber || undefined,
        currentStage: editForm.currentStage,
        roles: editForm.roles,
        primaryRabtakarId: editForm.primaryRabtakarId || undefined,
        defaultDaeenId: editForm.defaultDaeenId || undefined,
        notes: editForm.notes || undefined
      };
      if (editForm.currentStage !== PersonStage.DAEEN) {
        payload.currentUnitId = editForm.currentUnitId || undefined;
      }
      if (editForm.currentStage === PersonStage.RABTAKAR) {
        payload.assignedUnitIds = editForm.assignedUnitIds;
      }
      await ApiService.patch(`/people/${id}`, payload);
      await fetchProfile();
      setEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await ApiService.delete(`/people/${id}`);
      navigate('/people');
    } catch (err: any) {
      alert(err.message || 'Failed to delete person');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const toggleRole = (role: OrganizationalResponsibility) => {
    setEditForm((prev: any) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r: string) => r !== role)
        : [...prev.roles, role]
    }));
  };

  const toggleAssignedUnit = (unitId: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      assignedUnitIds: prev.assignedUnitIds.includes(unitId)
        ? prev.assignedUnitIds.filter((u: string) => u !== unitId)
        : [...prev.assignedUnitIds, unitId]
    }));
  };

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

  const rabtakarList = allPeople.filter(
    (p) => p.currentStage === PersonStage.RABTAKAR || p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
  );
  const daeenList = allPeople.filter(
    (p) => p.currentStage === PersonStage.DAEEN || p.roles?.includes(OrganizationalResponsibility.DAEEN)
  );

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        to="/people"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-typography-secondary hover:text-brand-red transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to People Directory</span>
      </Link>

      {/* Profile Card */}
      <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-typography-main">
                {editing ? (
                  <input
                    className="input-field text-xl font-bold"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, fullName: e.target.value }))}
                  />
                ) : (
                  person.fullName
                )}
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
              {person.contactNumber && !editing && (
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

          {/* Action Buttons */}
          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary text-xs py-1.5 px-3 gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="text-xs py-1.5 px-3 rounded-lg border border-status-error text-status-error hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stage & Roles — view or edit */}
        {editing ? (
          <div className="space-y-4 border-t border-surface-border pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact */}
              <div>
                <label className="block text-xs font-semibold text-typography-secondary mb-1">Contact Number</label>
                <input
                  className="input-field text-xs"
                  value={editForm.contactNumber}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, contactNumber: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="block text-xs font-semibold text-typography-secondary mb-1">Stage</label>
                <select
                  className="input-field text-xs"
                  value={editForm.currentStage}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, currentStage: e.target.value }))}
                >
                  <option value={PersonStage.MADU}>Madu</option>
                  <option value={PersonStage.MDF}>MDF</option>
                  <option value={PersonStage.RABTAKAR}>Rabtakar</option>
                  <option value={PersonStage.DAEEN}>Daeen (Sector Resource)</option>
                </select>
              </div>

              {/* Primary Unit — hidden for Daeen */}
              {editForm.currentStage !== PersonStage.DAEEN && (
                <div>
                  <label className="block text-xs font-semibold text-typography-secondary mb-1">Primary Unit</label>
                  <select
                    className="input-field text-xs"
                    value={editForm.currentUnitId}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, currentUnitId: e.target.value }))}
                  >
                    <option value="">No Unit</option>
                    {units.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rabtakar */}
              <div>
                <label className="block text-xs font-semibold text-typography-secondary mb-1">Primary Rabtakar</label>
                <select
                  className="input-field text-xs"
                  value={editForm.primaryRabtakarId}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, primaryRabtakarId: e.target.value }))}
                >
                  <option value="">None</option>
                  {rabtakarList.map((r) => (
                    <option key={r._id} value={r._id}>{r.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Daeen */}
              <div>
                <label className="block text-xs font-semibold text-typography-secondary mb-1">Default Daeen</label>
                <select
                  className="input-field text-xs"
                  value={editForm.defaultDaeenId}
                  onChange={(e) => setEditForm((p: any) => ({ ...p, defaultDaeenId: e.target.value }))}
                >
                  <option value="">None</option>
                  {daeenList.map((d) => (
                    <option key={d._id} value={d._id}>{d.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-unit for Rabtakar */}
            {editForm.currentStage === PersonStage.RABTAKAR && (
              <div>
                <label className="block text-xs font-semibold text-typography-secondary mb-1">
                  Assigned Units (Rabtakar can serve multiple units)
                </label>
                <div className="flex flex-wrap gap-2">
                  {units.map((u) => (
                    <label key={u._id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.assignedUnitIds.includes(u._id)}
                        onChange={() => toggleAssignedUnit(u._id)}
                        className="rounded"
                      />
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Roles */}
            <div>
              <label className="block text-xs font-semibold text-typography-secondary mb-1">Organizational Roles</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(OrganizationalResponsibility).map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-typography-secondary mb-1">Notes</label>
              <textarea
                className="input-field text-xs resize-none"
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((p: any) => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </div>
          </div>
        ) : (
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
        )}

        {/* Quick Metrics */}
        {!editing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-surface-border pt-4 text-xs">
            <div>
              <span className="text-typography-secondary block">Total Completed IMs</span>
              <span className="text-lg font-bold text-typography-main">{meetings?.length || 0}</span>
            </div>
            <div>
              <span className="text-typography-secondary block">Days Since Last IM</span>
              <span className="text-lg font-bold text-typography-main">
                {activity?.daysSinceLastMeeting !== null ? `${activity?.daysSinceLastMeeting}d` : '—'}
              </span>
            </div>
            <div>
              <span className="text-typography-secondary block">Promotions</span>
              <span className="text-lg font-bold text-typography-main">{promotions?.length || 0}</span>
            </div>
            <div>
              <span className="text-typography-secondary block">Unit Transfers</span>
              <span className="text-lg font-bold text-typography-main">{transfers?.length || 0}</span>
            </div>
          </div>
        )}

        {/* Notes (view mode) */}
        {!editing && person.notes && (
          <div className="border-t border-surface-border pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-typography-secondary mb-1">
              <FileText className="h-3.5 w-3.5" />
              Notes
            </div>
            <p className="text-xs text-typography-main">{person.notes}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-xl bg-white shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-status-error" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-typography-main">Delete Person</h3>
                <p className="text-xs text-typography-secondary">This will archive the record. You cannot undo this.</p>
              </div>
            </div>
            <p className="text-xs text-typography-main">
              Are you sure you want to delete <strong>{person.fullName}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-secondary text-xs py-1.5 px-3"
                disabled={deleting}
              >
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

      {/* Individual Meeting History */}
      <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-typography-main flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-brand-red" />
            <span>Individual Meeting History</span>
          </h2>
          <span className="text-xs text-typography-secondary">{meetings?.length || 0} recorded</span>
        </div>

        {!meetings || meetings.length === 0 ? (
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
          {!promotions || promotions.length === 0 ? (
            <p className="text-xs text-typography-secondary italic py-2">No promotions recorded.</p>
          ) : (
            <div className="space-y-3">
              {promotions.map((p: any) => (
                <div key={p._id} className="rounded-lg border border-surface-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-typography-main">
                    <span>{p.fromStage} → {p.toStage}</span>
                    <span className="text-[10px] text-typography-secondary">
                      {new Date(p.promotedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {p.remarks && <p className="text-[11px] text-typography-secondary">{p.remarks}</p>}
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
          {!transfers || transfers.length === 0 ? (
            <p className="text-xs text-typography-secondary italic py-2">No unit transfers recorded.</p>
          ) : (
            <div className="space-y-3">
              {transfers.map((t: any) => (
                <div key={t._id} className="rounded-lg border border-surface-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-typography-main">
                    <span>{t.fromUnitId?.name} → {t.toUnitId?.name}</span>
                    <span className="text-[10px] text-typography-secondary">
                      {new Date(t.transferredAt).toLocaleDateString()}
                    </span>
                  </div>
                  {t.remarks && <p className="text-[11px] text-typography-secondary">{t.remarks}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
