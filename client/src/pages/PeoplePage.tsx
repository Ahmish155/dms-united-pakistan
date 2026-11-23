import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  ArrowRight,
  TrendingUp,
  MapPin,
  Shield,
  ChevronRight
} from 'lucide-react';
import {
  PersonStage,
  OrganizationalResponsibility,
  ActivityStatus,
  WorkspaceRole
} from '@dms/shared';

export const PeoplePage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();
  const [people, setPeople] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'ALL' | PersonStage | 'DAEEN'>('ALL');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Add Person Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [unitId, setUnitId] = useState('');
  const [stage, setStage] = useState<PersonStage>(PersonStage.MADU);
  const [roles, setRoles] = useState<OrganizationalResponsibility[]>([]);
  const [primaryRabtakarId, setPrimaryRabtakarId] = useState('');
  const [defaultDaeenId, setDefaultDaeenId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Promote Modal
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [targetStage, setTargetStage] = useState<PersonStage>(PersonStage.MDF);
  const [remarks, setRemarks] = useState('');

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferUnitId, setTransferUnitId] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [peopleData, unitsData] = await Promise.all([
        ApiService.get<any[]>('/people'),
        ApiService.get<any[]>('/units')
      ]);
      setPeople(peopleData);
      setUnits(unitsData);
      if (unitsData.length > 0 && !unitId) {
        setUnitId(unitsData[0]._id);
      }
    } catch (err: any) {
      console.error('Error fetching people:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchData();
    }
  }, [activeWorkspace]);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ApiService.post('/people', {
        fullName,
        contactNumber: contactNumber || undefined,
        currentUnitId: unitId,
        currentStage: stage,
        roles,
        primaryRabtakarId: primaryRabtakarId || undefined,
        defaultDaeenId: defaultDaeenId || undefined,
        notes: notes || undefined
      });

      setFullName('');
      setContactNumber('');
      setNotes('');
      setRoles([]);
      setAddModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add person');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;
    try {
      setSubmitting(true);
      await ApiService.post(`/people/${selectedPerson._id}/promote`, {
        toStage: targetStage,
        remarks
      });
      setPromoteModalOpen(false);
      setSelectedPerson(null);
      setRemarks('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Promotion failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;
    try {
      setSubmitting(true);
      await ApiService.post(`/people/${selectedPerson._id}/transfer`, {
        toUnitId: transferUnitId,
        remarks: transferRemarks
      });
      setTransferModalOpen(false);
      setSelectedPerson(null);
      setTransferRemarks('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Unit transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  // Filtered People
  const filteredPeople = people.filter((p) => {
    if (selectedUnitId && p.currentUnitId?._id !== selectedUnitId) {
      return false;
    }
    if (search && !p.fullName.toLowerCase().includes(search.toLowerCase()) && !p.internalId.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (activeTab === 'ALL') return true;
    if (activeTab === 'DAEEN') {
      return p.roles?.includes(OrganizationalResponsibility.DAEEN);
    }
    return p.currentStage === activeTab;
  });

  const rabtakarCandidates = people.filter(
    (p) =>
      p.currentStage === PersonStage.RABTAKAR ||
      p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
  );

  const daeenCandidates = people.filter((p) =>
    p.roles?.includes(OrganizationalResponsibility.DAEEN)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            People Directory
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Centralized directory of Madu, MDF, Rabtakar, and Daeen for {activeWorkspace?.name}
          </p>
        </div>

        {isSecretary && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary gap-1.5 text-xs py-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Person</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex overflow-x-auto border-b border-surface-border pb-1 gap-2 text-xs">
          {[
            { id: 'ALL', label: 'All People' },
            { id: PersonStage.MADU, label: 'Madu' },
            { id: PersonStage.MDF, label: 'MDF' },
            { id: PersonStage.RABTAKAR, label: 'Rabtakar' },
            { id: 'DAEEN', label: 'Daeen' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-red text-white shadow-sm font-semibold'
                  : 'text-typography-secondary hover:bg-white hover:text-typography-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Unit Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-typography-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID (e.g. Tayyab or UP-0001)..."
              className="input-field pl-9 text-xs"
            />
          </div>

          <div className="sm:w-48">
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="input-field text-xs"
            >
              <option value="">All Units</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Listing (Responsive Cards) */}
      {loading ? (
        <div className="text-center py-12 text-xs text-typography-secondary">
          Loading directory...
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-white p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-typography-muted" />
          <h3 className="mt-2 text-sm font-semibold text-typography-main">No People Found</h3>
          <p className="mt-1 text-xs text-typography-secondary">
            Try adjusting your search filters or add a new person.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => {
            const isActive = person.activityStatus === ActivityStatus.ACTIVE;

            return (
              <div
                key={person._id}
                className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-3 hover:border-gray-300 transition-all"
              >
                {/* Person Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/people/${person._id}`}
                      className="font-bold text-sm text-typography-main hover:text-brand-red transition-colors flex items-center gap-1.5"
                    >
                      <span>{person.fullName}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-typography-muted" />
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-typography-secondary">
                        {person.internalId}
                      </span>
                      <span className="text-[10px] bg-surface-secondary px-1.5 py-0.2 rounded font-medium text-typography-main">
                        {person.currentUnitId?.name || 'No Unit'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Status Badge */}
                  <span className={isActive ? 'badge-active' : 'badge-inactive'}>
                    {isActive ? (
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserX className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </span>
                </div>

                {/* Stage & Roles */}
                <div className="flex flex-wrap gap-1">
                  <span className="rounded bg-brand-red-light px-2 py-0.5 text-[10px] font-semibold text-brand-red">
                    {person.currentStage}
                  </span>
                  {person.roles?.map((r: string) => (
                    <span
                      key={r}
                      className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-typography-secondary"
                    >
                      {r}
                    </span>
                  ))}
                </div>

                {/* Assignment Info */}
                <div className="border-t border-surface-border pt-2 text-[11px] text-typography-secondary space-y-1">
                  {person.primaryRabtakarId && (
                    <div className="flex justify-between">
                      <span>Rabtakar:</span>
                      <span className="font-medium text-typography-main">
                        {person.primaryRabtakarId.fullName}
                      </span>
                    </div>
                  )}
                  {person.defaultDaeenId && (
                    <div className="flex justify-between">
                      <span>Default Daeen:</span>
                      <span className="font-medium text-typography-main">
                        {person.defaultDaeenId.fullName}
                      </span>
                    </div>
                  )}
                  {person.daysSinceLastMeeting !== null && (
                    <div className="flex justify-between">
                      <span>Last Meeting:</span>
                      <span className="font-medium text-typography-main">
                        {person.daysSinceLastMeeting} days ago
                      </span>
                    </div>
                  )}
                  {person.activeAssociatedMaduCount !== undefined && (
                    <div className="flex justify-between">
                      <span>Associated Madu:</span>
                      <span className="font-medium text-typography-main">
                        {person.activeAssociatedMaduCount} active / {person.totalAssociatedMaduCount} total
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions (Secretary Only) */}
                {isSecretary && (
                  <div className="flex items-center justify-end gap-2 border-t border-surface-border pt-2">
                    {/* Promotion trigger */}
                    {person.currentStage === PersonStage.MADU && (
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setTargetStage(PersonStage.MDF);
                          setPromoteModalOpen(true);
                        }}
                        className="rounded px-2 py-1 text-[11px] font-semibold text-brand-red hover:bg-brand-red-light transition-colors"
                      >
                        Promote to MDF
                      </button>
                    )}
                    {person.currentStage === PersonStage.MDF && (
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setTargetStage(PersonStage.RABTAKAR);
                          setPromoteModalOpen(true);
                        }}
                        className="rounded px-2 py-1 text-[11px] font-semibold text-brand-red hover:bg-brand-red-light transition-colors"
                      >
                        Promote to Rabtakar
                      </button>
                    )}

                    {/* Unit Transfer trigger */}
                    <button
                      onClick={() => {
                        setSelectedPerson(person);
                        setTransferUnitId(person.currentUnitId?._id || '');
                        setTransferModalOpen(true);
                      }}
                      className="rounded px-2 py-1 text-[11px] font-medium text-typography-secondary hover:bg-surface-secondary transition-colors"
                    >
                      Transfer Unit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Person Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-6 shadow-xl my-8">
            <h3 className="font-bold text-base text-typography-main">Add Person</h3>
            <p className="text-xs text-typography-secondary mt-1">
              Register a new person into the centralized people directory.
            </p>

            <form onSubmit={handleAddPerson} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tayyab Mahmood"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Unit *
                </label>
                <select
                  required
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="input-field text-xs"
                >
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Organizational Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="input-field text-xs"
                >
                  <option value={PersonStage.MADU}>Madu (New contact)</option>
                  <option value={PersonStage.MDF}>MDF (Promoted contact)</option>
                  <option value={PersonStage.RABTAKAR}>Rabtakar (Active member)</option>
                  <option value={PersonStage.OTHER}>Other</option>
                </select>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Responsibilities (Multiple selectable)
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    OrganizationalResponsibility.RABTAKAR,
                    OrganizationalResponsibility.DAEEN,
                    OrganizationalResponsibility.MENTOR
                  ].map((r) => {
                    const isSelected = roles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setRoles(roles.filter((item) => item !== r));
                          } else {
                            setRoles([...roles, r]);
                          }
                        }}
                        className={`rounded-md px-2.5 py-1 border text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-brand-red text-white border-brand-red'
                            : 'bg-surface-secondary border-surface-border text-typography-main'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Rabtakar */}
              {stage === PersonStage.MADU && (
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Primary Rabtakar
                  </label>
                  <select
                    value={primaryRabtakarId}
                    onChange={(e) => setPrimaryRabtakarId(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="">Select Rabtakar</option>
                    {rabtakarCandidates.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.fullName} ({r.currentUnitId?.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Default Daeen */}
              {(stage === PersonStage.MADU || stage === PersonStage.MDF) && (
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Default Assigned Daeen
                  </label>
                  <select
                    value={defaultDaeenId}
                    onChange={(e) => setDefaultDaeenId(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="">Select Daeen</option>
                    {daeenCandidates.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Contact Number (Optional)
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="03001234567"
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2"
                >
                  {submitting ? 'Saving...' : 'Save Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {promoteModalOpen && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-surface-border bg-white p-6 shadow-xl">
            <h3 className="font-bold text-base text-typography-main">
              Promote {selectedPerson.fullName}
            </h3>
            <p className="text-xs text-typography-secondary mt-1">
              Promoting from <strong className="text-typography-main">{selectedPerson.currentStage}</strong> to{' '}
              <strong className="text-brand-red">{targetStage}</strong>. All meeting history is preserved.
            </p>

            <form onSubmit={handlePromote} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Promotion Remarks / Reason
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Completed target Dawati meetings and demonstrated active engagement."
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPromoteModalOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2"
                >
                  {submitting ? 'Promoting...' : `Confirm Promotion to ${targetStage}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Transfer Modal */}
      {transferModalOpen && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-surface-border bg-white p-6 shadow-xl">
            <h3 className="font-bold text-base text-typography-main">
              Transfer {selectedPerson.fullName}
            </h3>
            <p className="text-xs text-typography-secondary mt-1">
              Current Unit: <strong className="text-typography-main">{selectedPerson.currentUnitId?.name}</strong>.
              Historical meetings permanently stay attributed to their past unit.
            </p>

            <form onSubmit={handleTransfer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  New Destination Unit *
                </label>
                <select
                  required
                  value={transferUnitId}
                  onChange={(e) => setTransferUnitId(e.target.value)}
                  className="input-field text-xs"
                >
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Transfer Remarks
                </label>
                <textarea
                  rows={2}
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="e.g. Changed address/residence"
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2"
                >
                  {submitting ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
