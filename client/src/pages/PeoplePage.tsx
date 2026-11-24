import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Layers,
  PauseCircle,
  PlayCircle,
  UserMinus,
  CheckCircle2,
  Clock,
  Shield,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import {
  PersonStage,
  OrganizationalResponsibility,
  ActivityStatus,
  OperationalStatus,
  WorkspaceRole
} from '@dms/shared';

export const PeoplePage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();
  const [people, setPeople] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<
    'ALL' | PersonStage | 'DAEEN' | 'PIPELINE' | 'FREEZED' | 'DROPPED' | 'PORTFOLIOS'
  >('ALL');
  const [portfolioSubTab, setPortfolioSubTab] = useState<'DAEEN' | 'RABTAKAR'>('DAEEN');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Add Person Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [unitId, setUnitId] = useState('');
  const [assignedUnitIds, setAssignedUnitIds] = useState<string[]>([]);
  const [stage, setStage] = useState<PersonStage>(PersonStage.MADU);
  const [operationalStatus, setOperationalStatus] = useState<OperationalStatus>(OperationalStatus.ACTIVE);
  const [roles, setRoles] = useState<OrganizationalResponsibility[]>([]);
  const [primaryRabtakarId, setPrimaryRabtakarId] = useState('');
  const [defaultDaeenId, setDefaultDaeenId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Person
  const [deletePersonTarget, setDeletePersonTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        currentUnitId: stage !== PersonStage.DAEEN ? (unitId || undefined) : undefined,
        assignedUnitIds: stage === PersonStage.RABTAKAR ? assignedUnitIds : undefined,
        currentStage: stage,
        operationalStatus,
        roles,
        primaryRabtakarId: primaryRabtakarId || undefined,
        defaultDaeenId: defaultDaeenId || undefined,
        notes: notes || undefined
      });

      setFullName('');
      setContactNumber('');
      setNotes('');
      setRoles([]);
      setAssignedUnitIds([]);
      setOperationalStatus(OperationalStatus.ACTIVE);
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

  const handleQuickStatusChange = async (personId: string, newStatus: OperationalStatus) => {
    try {
      await ApiService.patch(`/people/${personId}`, { operationalStatus: newStatus });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePersonTarget) return;
    try {
      setDeleting(true);
      await ApiService.delete(`/people/${deletePersonTarget._id}`);
      setDeletePersonTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete person');
    } finally {
      setDeleting(false);
    }
  };

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  // Filtered People for Directory
  const filteredPeople = people.filter((p) => {
    if (selectedUnitId && (p.currentUnitId?._id || p.currentUnitId) !== selectedUnitId) {
      return false;
    }
    if (
      search &&
      !p.fullName.toLowerCase().includes(search.toLowerCase()) &&
      !p.internalId.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    if (activeTab === 'ALL') return true;
    if (activeTab === 'DAEEN') {
      return p.currentStage === PersonStage.DAEEN || p.roles?.includes(OrganizationalResponsibility.DAEEN);
    }
    if (activeTab === 'PIPELINE') {
      return p.operationalStatus === OperationalStatus.PIPELINE;
    }
    if (activeTab === 'FREEZED') {
      return p.operationalStatus === OperationalStatus.FREEZED;
    }
    if (activeTab === 'DROPPED') {
      return p.operationalStatus === OperationalStatus.DROPPED;
    }
    return p.currentStage === activeTab;
  });

  const rabtakarCandidates = people.filter(
    (p) =>
      p.currentStage === PersonStage.RABTAKAR ||
      p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
  );

  const daeenCandidates = people.filter((p) =>
    p.currentStage === PersonStage.DAEEN ||
    p.roles?.includes(OrganizationalResponsibility.DAEEN)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            People & Portfolios
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Directory of Madu, MDF, Rabtakar, Daeen, and Future Pipeline for {activeWorkspace?.name}
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
            { id: 'ALL', label: `All People (${people.length})` },
            { id: PersonStage.MADU, label: 'Madu' },
            { id: PersonStage.MDF, label: 'MDF' },
            { id: PersonStage.RABTAKAR, label: 'Rabtakar' },
            { id: 'DAEEN', label: 'Daeen' },
            {
              id: 'PIPELINE',
              label: `Future Pipeline (${people.filter((p) => p.operationalStatus === OperationalStatus.PIPELINE).length})`
            },
            {
              id: 'FREEZED',
              label: `Freezed (${people.filter((p) => p.operationalStatus === OperationalStatus.FREEZED).length})`
            },
            {
              id: 'DROPPED',
              label: `Dropped (${people.filter((p) => p.operationalStatus === OperationalStatus.DROPPED).length})`
            },
            { id: 'PORTFOLIOS', label: '★ Portfolios & Associations' }
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

        {/* Search & Unit Filter (when not in Portfolios view) */}
        {activeTab !== 'PORTFOLIOS' && (
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
        )}
      </div>

      {/* PORTFOLIOS & ASSOCIATIONS VIEW */}
      {activeTab === 'PORTFOLIOS' ? (
        <div className="space-y-4">
          {/* Sub-tabs for Portfolios */}
          <div className="inline-flex rounded-lg border border-surface-border bg-white p-0.5 shadow-sm text-xs">
            <button
              onClick={() => setPortfolioSubTab('DAEEN')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                portfolioSubTab === 'DAEEN'
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'text-typography-secondary hover:text-typography-main'
              }`}
            >
              Daeen & Associated Madu ({daeenCandidates.length})
            </button>
            <button
              onClick={() => setPortfolioSubTab('RABTAKAR')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                portfolioSubTab === 'RABTAKAR'
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'text-typography-secondary hover:text-typography-main'
              }`}
            >
              Rabtakar & Provided Madu ({rabtakarCandidates.length})
            </button>
          </div>

          {/* DAEEN PORTFOLIO TAB */}
          {portfolioSubTab === 'DAEEN' ? (
            <div className="space-y-4">
              {daeenCandidates.length === 0 ? (
                <div className="rounded-xl border border-surface-border bg-white p-8 text-center text-xs text-typography-muted">
                  No Daeen registered in this sector yet.
                </div>
              ) : (
                daeenCandidates.map((daeen) => {
                  const associated = people.filter(
                    (p) => (p.defaultDaeenId?._id || p.defaultDaeenId) === daeen._id
                  );
                  return (
                    <div key={daeen._id} className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link to={`/people/${daeen._id}`} className="font-bold text-sm text-typography-main hover:text-brand-red flex items-center gap-1.5">
                            <Shield className="h-4 w-4 text-brand-red" />
                            <span>{daeen.fullName}</span>
                            <span className="text-[10px] font-mono text-typography-secondary font-normal">({daeen.internalId})</span>
                          </Link>
                          <p className="text-[11px] text-typography-secondary mt-0.5">
                            Sector Resource • Meetings Conducted: <span className="font-bold text-typography-main">{daeen.totalMeetingsConducted || 0}</span>
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-red-light px-2.5 py-0.5 text-[11px] font-bold text-brand-red">
                          {associated.length} Associated Contacts
                        </span>
                      </div>

                      {associated.length === 0 ? (
                        <p className="text-xs text-typography-secondary italic py-1">
                          No Madu contacts currently assigned to this Daeen.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-secondary text-typography-secondary border-b border-surface-border">
                              <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Stage</th>
                                <th className="p-2">Unit</th>
                                <th className="p-2">Rabtakar</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Last Meeting</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                              {associated.map((m) => (
                                <tr key={m._id} className="hover:bg-gray-50">
                                  <td className="p-2 font-bold">
                                    <Link to={`/people/${m._id}`} className="hover:text-brand-red">
                                      {m.fullName}
                                    </Link>
                                  </td>
                                  <td className="p-2">{m.currentStage}</td>
                                  <td className="p-2">{m.currentUnitId?.name || 'N/A'}</td>
                                  <td className="p-2 text-typography-secondary">{m.primaryRabtakarId?.fullName || '—'}</td>
                                  <td className="p-2">
                                    <span className="font-semibold text-[10px]">{m.operationalStatus || 'ACTIVE'}</span>
                                  </td>
                                  <td className="p-2 text-typography-secondary">
                                    {m.lastMeetingDate ? new Date(m.lastMeetingDate).toLocaleDateString() : 'Never'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* RABTAKAR PORTFOLIO TAB */
            <div className="space-y-4">
              {rabtakarCandidates.length === 0 ? (
                <div className="rounded-xl border border-surface-border bg-white p-8 text-center text-xs text-typography-muted">
                  No Rabtakar registered in this sector yet.
                </div>
              ) : (
                rabtakarCandidates.map((rabtakar) => {
                  const provided = people.filter(
                    (p) => (p.primaryRabtakarId?._id || p.primaryRabtakarId) === rabtakar._id
                  );
                  const activeCount = provided.filter((p) => p.activityStatus === ActivityStatus.ACTIVE).length;
                  const pipelineCount = provided.filter((p) => p.operationalStatus === OperationalStatus.PIPELINE).length;

                  return (
                    <div key={rabtakar._id} className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link to={`/people/${rabtakar._id}`} className="font-bold text-sm text-typography-main hover:text-brand-red flex items-center gap-1.5">
                            <UserCheck className="h-4 w-4 text-brand-red" />
                            <span>{rabtakar.fullName}</span>
                            <span className="text-[10px] font-mono text-typography-secondary font-normal">({rabtakar.internalId})</span>
                          </Link>
                          <p className="text-[11px] text-typography-secondary mt-0.5">
                            Unit: <span className="font-semibold">{rabtakar.currentUnitId?.name || 'Multi-Unit'}</span> • Total Provided: <span className="font-bold text-typography-main">{provided.length}</span> ({activeCount} active, {pipelineCount} pipeline)
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-red-light px-2.5 py-0.5 text-[11px] font-bold text-brand-red">
                          {provided.length} Contacts Provided
                        </span>
                      </div>

                      {provided.length === 0 ? (
                        <p className="text-xs text-typography-secondary italic py-1">
                          No Madu contacts currently provided by this Rabtakar.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-secondary text-typography-secondary border-b border-surface-border">
                              <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Stage</th>
                                <th className="p-2">Unit</th>
                                <th className="p-2">Daeen Assigned</th>
                                <th className="p-2">Lifecycle Status</th>
                                <th className="p-2">Last Meeting</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                              {provided.map((m) => (
                                <tr key={m._id} className="hover:bg-gray-50">
                                  <td className="p-2 font-bold">
                                    <Link to={`/people/${m._id}`} className="hover:text-brand-red">
                                      {m.fullName}
                                    </Link>
                                  </td>
                                  <td className="p-2">{m.currentStage}</td>
                                  <td className="p-2">{m.currentUnitId?.name || 'N/A'}</td>
                                  <td className="p-2 text-typography-secondary">{m.defaultDaeenId?.fullName || 'Not Assigned'}</td>
                                  <td className="p-2">
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                        m.operationalStatus === OperationalStatus.PIPELINE
                                          ? 'bg-blue-100 text-blue-700'
                                          : m.operationalStatus === OperationalStatus.FREEZED
                                          ? 'bg-cyan-100 text-cyan-800'
                                          : m.operationalStatus === OperationalStatus.DROPPED
                                          ? 'bg-gray-200 text-gray-700'
                                          : 'bg-green-100 text-status-success'
                                      }`}
                                    >
                                      {m.operationalStatus || 'ACTIVE'}
                                    </span>
                                  </td>
                                  <td className="p-2 text-typography-secondary">
                                    {m.lastMeetingDate ? new Date(m.lastMeetingDate).toLocaleDateString() : 'Never'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : loading ? (
        /* STANDARD DIRECTORY LISTING */
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
            const isPipeline = person.operationalStatus === OperationalStatus.PIPELINE;
            const isFreezed = person.operationalStatus === OperationalStatus.FREEZED;
            const isDropped = person.operationalStatus === OperationalStatus.DROPPED;

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
                        {person.currentStage === PersonStage.DAEEN
                          ? 'Sector Resource'
                          : person.currentUnitId?.name || 'No Unit'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1">
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
                    {person.operationalStatus && person.operationalStatus !== OperationalStatus.ACTIVE && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          isPipeline
                            ? 'bg-blue-100 text-blue-700'
                            : isFreezed
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {person.operationalStatus}
                      </span>
                    )}
                  </div>
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
                  {person.lastMeetingDate ? (
                    <div className="flex justify-between">
                      <span>Last Meeting:</span>
                      <span className="font-medium text-typography-main">
                        {new Date(person.lastMeetingDate).toLocaleDateString()} ({person.daysSinceLastMeeting}d ago)
                      </span>
                    </div>
                  ) : person.daysSinceLastMeeting !== null && (
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
                  <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-surface-border pt-2">
                    {/* Lifecycle Quick Actions */}
                    {isPipeline && (
                      <button
                        onClick={() => handleQuickStatusChange(person._id, OperationalStatus.ACTIVE)}
                        className="rounded px-2 py-1 text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        Move to Active
                      </button>
                    )}
                    {!isFreezed && !isPipeline && (
                      <button
                        onClick={() => handleQuickStatusChange(person._id, OperationalStatus.FREEZED)}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-cyan-800 hover:bg-cyan-50 border border-cyan-200 transition-colors"
                      >
                        Freeze
                      </button>
                    )}
                    {isFreezed && (
                      <button
                        onClick={() => handleQuickStatusChange(person._id, OperationalStatus.ACTIVE)}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                      >
                        Unfreeze
                      </button>
                    )}
                    {!isDropped && !isPipeline && (
                      <button
                        onClick={() => handleQuickStatusChange(person._id, OperationalStatus.DROPPED)}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                      >
                        Drop
                      </button>
                    )}
                    {isDropped && (
                      <button
                        onClick={() => handleQuickStatusChange(person._id, OperationalStatus.ACTIVE)}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                      >
                        Reactivate
                      </button>
                    )}

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
                        Promote
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
                        Promote
                      </button>
                    )}

                    {/* Unit Transfer trigger */}
                    {person.currentStage !== PersonStage.DAEEN && (
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setTransferUnitId(person.currentUnitId?._id || '');
                          setTransferModalOpen(true);
                        }}
                        className="rounded px-2 py-1 text-[11px] font-medium text-typography-secondary hover:bg-surface-secondary transition-colors"
                      >
                        Transfer
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => setDeletePersonTarget(person)}
                      className="rounded px-2 py-1 text-[11px] font-medium text-status-error hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 inline mr-0.5" />
                      Delete
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
          <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-6 shadow-xl my-8 space-y-4">
            <h3 className="font-bold text-base text-typography-main">Add Person</h3>
            <p className="text-xs text-typography-secondary">
              Register a new person, Madu, MDF, Rabtakar, Daeen, or Future Pipeline contact.
            </p>

            <form onSubmit={handleAddPerson} className="space-y-3">
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
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Organizational Stage *
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="input-field text-xs"
                >
                  <option value={PersonStage.MADU}>Madu (New contact)</option>
                  <option value={PersonStage.MDF}>MDF (Promoted contact)</option>
                  <option value={PersonStage.RABTAKAR}>Rabtakar (Active member)</option>
                  <option value={PersonStage.DAEEN}>Daeen (Sector Resource — no unit)</option>
                  <option value={PersonStage.OTHER}>Other</option>
                </select>
              </div>

              {/* Status / Pipeline toggle */}
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Initial Status
                </label>
                <select
                  value={operationalStatus}
                  onChange={(e) => setOperationalStatus(e.target.value as any)}
                  className="input-field text-xs"
                >
                  <option value={OperationalStatus.ACTIVE}>Active</option>
                  <option value={OperationalStatus.PIPELINE}>Future Pipeline (Rabtakar provided name, no meetings yet)</option>
                  <option value={OperationalStatus.FREEZED}>Freezed</option>
                  <option value={OperationalStatus.DROPPED}>Dropped</option>
                </select>
              </div>

              {/* Unit (hidden for Daeen) */}
              {stage !== PersonStage.DAEEN && (
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Primary Unit *
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
              )}

              {/* Rabtakar multi-unit assignment */}
              {stage === PersonStage.RABTAKAR && (
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Assigned Units (Rabtakar can serve multiple)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {units.map((u) => (
                      <label key={u._id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignedUnitIds.includes(u._id)}
                          onChange={() =>
                            setAssignedUnitIds((prev) =>
                              prev.includes(u._id) ? prev.filter((x) => x !== u._id) : [...prev, u._id]
                            )
                          }
                          className="rounded"
                        />
                        <span>{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Rabtakar */}
              {(stage === PersonStage.MADU || stage === PersonStage.MDF) && (
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
                        {r.fullName} ({r.currentUnitId?.name || 'All Units'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Default Daeen (optional, especially for pipeline) */}
              {(stage === PersonStage.MADU || stage === PersonStage.MDF) && (
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Default Daeen {operationalStatus === OperationalStatus.PIPELINE && '(Optional for Pipeline)'}
                  </label>
                  <select
                    value={defaultDaeenId}
                    onChange={(e) => setDefaultDaeenId(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="">None (Can assign later)</option>
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
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes or background info..."
                  className="input-field text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
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
                  {submitting ? 'Adding...' : 'Add Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletePersonTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-xl bg-white shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-status-error" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-typography-main">Delete Person</h3>
                <p className="text-xs text-typography-secondary">This will archive the record permanently.</p>
              </div>
            </div>
            <p className="text-xs text-typography-main">
              Are you sure you want to delete <strong>{deletePersonTarget.fullName}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeletePersonTarget(null)}
                className="btn-secondary text-xs py-1.5 px-3"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePerson}
                disabled={deleting}
                className="text-xs py-1.5 px-4 rounded-lg bg-status-error text-white hover:opacity-90 font-semibold transition-opacity"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {promoteModalOpen && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-surface-border bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-typography-main">
              Promote {selectedPerson.fullName}
            </h3>
            <p className="text-xs text-typography-secondary">
              Promote from {selectedPerson.currentStage} to {targetStage}.
            </p>
            <form onSubmit={handlePromote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Promotion criteria fulfilled..."
                  className="input-field text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPromoteModalOpen(false)} className="btn-secondary text-xs py-1.5">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs py-1.5">
                  Confirm Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalOpen && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-surface-border bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-typography-main">
              Transfer {selectedPerson.fullName}
            </h3>
            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Target Unit</label>
                <select
                  required
                  value={transferUnitId}
                  onChange={(e) => setTransferUnitId(e.target.value)}
                  className="input-field text-xs"
                >
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">Remarks</label>
                <input
                  type="text"
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="Reason for unit transfer..."
                  className="input-field text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTransferModalOpen(false)} className="btn-secondary text-xs py-1.5">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs py-1.5">
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
