import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  CalendarCheck,
  ArrowLeft,
  User,
  Users,
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { PersonStage, OrganizationalResponsibility } from '@dms/shared';

export const RecordMeetingPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  const [units, setUnits] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields (Cascading Order: Unit -> Rabtakar -> Madu/Person -> Daeen -> Date)
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [rabtakarId, setRabtakarId] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [primaryDaeenId, setPrimaryDaeenId] = useState('');
  const [additionalDaeenIds, setAdditionalDaeenIds] = useState<string[]>([]);
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [comments, setComments] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [unitsData, peopleData] = await Promise.all([
          ApiService.get<any[]>('/units'),
          ApiService.get<any[]>('/people')
        ]);
        setUnits(unitsData);
        setPeople(peopleData);

        if (unitsData.length > 0) {
          setSelectedUnitId(unitsData[0]._id);
        }
      } catch (err: any) {
        console.error('Failed to load form prerequisites:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeWorkspace) {
      fetchData();
    }
  }, [activeWorkspace]);

  // When Unit changes: reset Rabtakar and Person selections if not matching
  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setRabtakarId('');
    setSelectedPersonId('');
    setDuplicateWarning(null);
  };

  // When Rabtakar changes: reset Person selection and filter
  const handleRabtakarChange = (rId: string) => {
    setRabtakarId(rId);
    setSelectedPersonId('');
    setDuplicateWarning(null);
  };

  // When Person changes: auto-select their default Daeen
  const handlePersonChange = (personId: string) => {
    setSelectedPersonId(personId);
    setDuplicateWarning(null);

    const person = people.find((p) => p._id === personId);
    if (person) {
      if (person.defaultDaeenId?._id) {
        setPrimaryDaeenId(person.defaultDaeenId._id);
      } else if (person.defaultDaeenId) {
        setPrimaryDaeenId(person.defaultDaeenId);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent, allowDuplicate = false) => {
    if (e) e.preventDefault();
    if (!selectedPersonId) {
      alert('Please select a Madu / MDF');
      return;
    }
    if (!primaryDaeenId) {
      alert('Please select a Primary Daeen');
      return;
    }

    setSubmitting(true);
    setDuplicateWarning(null);

    try {
      await ApiService.post('/meetings', {
        personId: selectedPersonId,
        unitId: selectedUnitId || undefined,
        rabtakarId: rabtakarId || undefined,
        primaryDaeenId,
        additionalDaeenIds,
        meetingDate: new Date(meetingDate).toISOString(),
        comments: comments || undefined,
        allowDuplicate
      });

      navigate('/meetings');
    } catch (err: any) {
      if (err.message && err.message.includes('already been recorded')) {
        setDuplicateWarning(err.message);
      } else {
        alert(err.message || 'Failed to record meeting');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Rabtakars associated with the selected Unit
  const filteredRabtakars = people.filter((p) => {
    const isRabtakar =
      p.currentStage === PersonStage.RABTAKAR ||
      p.roles?.includes(OrganizationalResponsibility.RABTAKAR);
    if (!isRabtakar) return false;
    if (!selectedUnitId) return true;

    // Check primary unit
    if (p.currentUnitId?._id === selectedUnitId || p.currentUnitId === selectedUnitId) return true;
    // Check assigned units (multi-unit support)
    if (p.assignedUnitIds && Array.isArray(p.assignedUnitIds)) {
      return p.assignedUnitIds.some((u: any) => (u._id || u) === selectedUnitId);
    }
    return false;
  });

  // 2. Madu/MDF filtered by Unit AND by Rabtakar
  const filteredPeople = people.filter((p) => {
    const isMaduOrMdf =
      p.currentStage === PersonStage.MADU || p.currentStage === PersonStage.MDF;
    if (!isMaduOrMdf) return false;

    // Filter by Unit
    if (selectedUnitId && (p.currentUnitId?._id || p.currentUnitId) !== selectedUnitId) {
      return false;
    }

    // Filter by Rabtakar
    if (rabtakarId) {
      const pRId = p.primaryRabtakarId?._id || p.primaryRabtakarId;
      return pRId === rabtakarId;
    }

    return true;
  });

  // 3. Daeen Candidates (Sector Resource)
  const daeenCandidates = people.filter(
    (p) =>
      p.currentStage === PersonStage.DAEEN ||
      p.roles?.includes(OrganizationalResponsibility.DAEEN)
  );

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Link
        to="/meetings"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-typography-secondary hover:text-brand-red transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Meetings</span>
      </Link>

      <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-sm space-y-5">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-typography-main">
            Record Individual Meeting (IM)
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Log a completed meeting. Select Unit $\to$ Assigned Rabtakar $\to$ Associated Madu.
          </p>
        </div>

        {duplicateWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Duplicate Meeting Detected</span>
            </div>
            <p className="text-amber-700">{duplicateWarning}</p>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                className="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700"
              >
                Yes, Save Anyway
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          {/* Step 1: Unit Selector */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              1. Select Unit *
            </label>
            <select
              required
              value={selectedUnitId}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="input-field text-xs"
            >
              <option value="">Choose Unit...</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Rabtakar (Filtered to Unit) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-typography-main">
                2. Select Rabtakar *
              </label>
              <span className="text-[10px] text-typography-secondary">
                {filteredRabtakars.length} available in unit
              </span>
            </div>
            <select
              required
              value={rabtakarId}
              onChange={(e) => handleRabtakarChange(e.target.value)}
              className="input-field text-xs"
              disabled={!selectedUnitId}
            >
              <option value="">
                {selectedUnitId ? 'Choose Rabtakar...' : 'Select a Unit first'}
              </option>
              {filteredRabtakars.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.fullName} ({r.internalId})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Person (Madu / MDF) Filtered by Unit & Rabtakar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-typography-main">
                3. Select Madu / MDF *
              </label>
              <span className="text-[10px] text-typography-secondary">
                {filteredPeople.length} matched contacts
              </span>
            </div>
            <select
              required
              value={selectedPersonId}
              onChange={(e) => handlePersonChange(e.target.value)}
              className="input-field text-xs"
              disabled={!rabtakarId}
            >
              <option value="">
                {rabtakarId ? 'Choose Madu or MDF...' : 'Select a Rabtakar first'}
              </option>
              {filteredPeople.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.currentStage}) — {p.internalId}
                </option>
              ))}
            </select>
            {rabtakarId && filteredPeople.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No Madu assigned to this Rabtakar in this unit yet. Add one in People or select another Rabtakar.
              </p>
            )}
          </div>

          {/* Step 4: Primary Daeen */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              4. Primary Daeen (Sector Resource) *
            </label>
            <select
              required
              value={primaryDaeenId}
              onChange={(e) => setPrimaryDaeenId(e.target.value)}
              className="input-field text-xs"
            >
              <option value="">Select Primary Daeen...</option>
              {daeenCandidates.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.fullName} ({d.internalId})
                </option>
              ))}
            </select>
          </div>

          {/* Step 5: Meeting Date */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              5. Meeting Date *
            </label>
            <input
              type="date"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          {/* Step 6: Comments */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Meeting Notes / Dawati Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Discussed core concepts, confirmed attendance for next DF..."
              className="input-field text-xs resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !selectedPersonId || !primaryDaeenId}
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? 'Recording Meeting...' : 'Record Meeting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
