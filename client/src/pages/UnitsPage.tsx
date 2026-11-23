import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { Building2, Plus, UserCheck, Shield, AlertCircle, Edit2 } from 'lucide-react';
import { WorkspaceRole } from '@dms/shared';

export const UnitsPage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();
  const [units, setUnits] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Unit Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Assign Leadership Modal state
  const [leadershipModalOpen, setLeadershipModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [presidentPersonId, setPresidentPersonId] = useState<string>('');
  const [generalSecretaryPersonId, setGeneralSecretaryPersonId] = useState<string>('');
  const [savingLeadership, setSavingLeadership] = useState(false);

  const fetchUnitsAndPeople = async () => {
    try {
      setLoading(true);
      setError(null);
      const [unitsData, peopleData] = await Promise.all([
        ApiService.get<any[]>('/units'),
        ApiService.get<any[]>('/people')
      ]);
      setUnits(unitsData);
      setPeople(peopleData);
    } catch (err: any) {
      setError(err.message || 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchUnitsAndPeople();
    }
  }, [activeWorkspace]);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ApiService.post('/units', { name, code });
      setName('');
      setCode('');
      setCreateModalOpen(false);
      await fetchUnitsAndPeople();
    } catch (err: any) {
      alert(err.message || 'Failed to create unit');
    } finally {
      setSubmitting(false);
    }
  };

  const openLeadershipModal = (unit: any) => {
    setSelectedUnit(unit);
    setPresidentPersonId(unit.presidentPersonId?._id || unit.presidentPersonId || '');
    setGeneralSecretaryPersonId(unit.generalSecretaryPersonId?._id || unit.generalSecretaryPersonId || '');
    setLeadershipModalOpen(true);
  };

  const handleSaveLeadership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    try {
      setSavingLeadership(true);
      await ApiService.patch(`/units/${selectedUnit._id}`, {
        presidentPersonId: presidentPersonId || null,
        generalSecretaryPersonId: generalSecretaryPersonId || null
      });
      setLeadershipModalOpen(false);
      setSelectedUnit(null);
      await fetchUnitsAndPeople();
    } catch (err: any) {
      alert(err.message || 'Failed to update unit leadership');
    } finally {
      setSavingLeadership(false);
    }
  };

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            Units Management
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Subdivisions and local leadership within {activeWorkspace?.name}
          </p>
        </div>

        {isSecretary && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary gap-1.5 text-xs py-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Unit</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-status-error border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Units Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-typography-secondary">
          Loading units...
        </div>
      ) : units.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-white p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-typography-muted" />
          <h3 className="mt-2 text-sm font-semibold text-typography-main">No Units Created</h3>
          <p className="mt-1 text-xs text-typography-secondary">
            Get started by adding organizational units like Morgah, Lalkurti, Comsats, or Hostel City.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div
              key={unit._id}
              className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-typography-main">{unit.name}</h3>
                  <span className="inline-block mt-0.5 font-mono text-xs text-typography-secondary uppercase bg-surface-secondary px-2 py-0.5 rounded">
                    Code: {unit.code}
                  </span>
                </div>
                <span className="badge-active text-[10px]">Active</span>
              </div>

              {/* Officeholders (Part 3.4) */}
              <div className="border-t border-surface-border pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-typography-secondary">Unit President:</span>
                  <span className="font-medium text-typography-main">
                    {unit.presidentPersonId?.fullName || (
                      <span className="text-typography-muted italic">Unassigned</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-typography-secondary">Unit Gen. Secretary:</span>
                  <span className="font-medium text-typography-main">
                    {unit.generalSecretaryPersonId?.fullName || (
                      <span className="text-typography-muted italic">Unassigned</span>
                    )}
                  </span>
                </div>

                {isSecretary && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => openLeadershipModal(unit)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-surface-border bg-surface-secondary text-typography-main hover:bg-neutral-100 text-xs font-medium transition-colors"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Assign Leadership</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Leadership Modal */}
      {leadershipModalOpen && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-surface-border bg-white p-6 shadow-xl">
            <h3 className="font-bold text-base text-typography-main">
              Assign Leadership — {selectedUnit.name}
            </h3>
            <p className="text-xs text-typography-secondary mt-1">
              Select Unit President and General Secretary from the sector directory.
            </p>

            <form onSubmit={handleSaveLeadership} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Unit President
                </label>
                <select
                  value={presidentPersonId}
                  onChange={(e) => setPresidentPersonId(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">-- None / Unassigned --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.internalId}) - {p.currentUnitId?.name || 'Sector'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Unit General Secretary
                </label>
                <select
                  value={generalSecretaryPersonId}
                  onChange={(e) => setGeneralSecretaryPersonId(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">-- None / Unassigned --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.internalId}) - {p.currentUnitId?.name || 'Sector'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLeadershipModalOpen(false);
                    setSelectedUnit(null);
                  }}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLeadership}
                  className="btn-primary text-xs py-2"
                >
                  {savingLeadership ? 'Saving...' : 'Save Officeholders'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Unit Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-surface-border bg-white p-6 shadow-xl">
            <h3 className="font-bold text-base text-typography-main">Add New Unit</h3>
            <p className="text-xs text-typography-secondary mt-1">
              Add a new geographical or organizational unit to this sector.
            </p>

            <form onSubmit={handleCreateUnit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Unit Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morgah"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Unit Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MOR"
                  className="input-field uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2"
                >
                  {submitting ? 'Creating...' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
