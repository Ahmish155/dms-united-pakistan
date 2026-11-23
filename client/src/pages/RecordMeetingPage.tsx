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

  // Form Fields
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [rabtakarId, setRabtakarId] = useState('');
  const [primaryDaeenId, setPrimaryDaeenId] = useState('');
  const [additionalDaeenIds, setAdditionalDaeenIds] = useState<string[]>([]);
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [meetingNumber, setMeetingNumber] = useState<number>(1);
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

  // When person changes, auto-populate unit, rabtakar, default daeen & calculate meeting number
  const handlePersonChange = (personId: string) => {
    setSelectedPersonId(personId);
    setDuplicateWarning(null);

    const person = people.find((p) => p._id === personId);
    if (person) {
      if (person.currentUnitId?._id) {
        setSelectedUnitId(person.currentUnitId._id);
      }
      if (person.primaryRabtakarId?._id) {
        setRabtakarId(person.primaryRabtakarId._id);
      }
      if (person.defaultDaeenId?._id) {
        setPrimaryDaeenId(person.defaultDaeenId._id);
      }

      // Next meeting number calculation
      const pastMeetingsCount = person.meetingsCount || 0;
      setMeetingNumber(pastMeetingsCount + 1);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, allowDuplicate = false) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setDuplicateWarning(null);

    try {
      await ApiService.post('/meetings', {
        personId: selectedPersonId,
        rabtakarId,
        primaryDaeenId,
        additionalDaeenIds,
        meetingDate: new Date(meetingDate).toISOString(),
        meetingNumber,
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

  // Filter candidates
  const eligiblePeople = people.filter(
    (p) =>
      (p.currentStage === PersonStage.MADU ||
        p.currentStage === PersonStage.MDF) &&
      (!selectedUnitId || p.currentUnitId?._id === selectedUnitId)
  );

  const rabtakarCandidates = people.filter(
    (p) =>
      p.currentStage === PersonStage.RABTAKAR ||
      p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
  );

  const daeenCandidates = people.filter((p) =>
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
            Log a completed meeting for {activeWorkspace?.name}. Unit and assignments auto-populate.
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
          {/* 1. Unit Selector */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Unit
            </label>
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

          {/* 2. Person Selector */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Select Person (Madu / MDF) *
            </label>
            <select
              required
              value={selectedPersonId}
              onChange={(e) => handlePersonChange(e.target.value)}
              className="input-field text-xs font-medium"
            >
              <option value="">-- Choose person --</option>
              {eligiblePeople.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.currentStage}) — {p.currentUnitId?.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Rabtakar */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Rabtakar *
            </label>
            <select
              required
              value={rabtakarId}
              onChange={(e) => setRabtakarId(e.target.value)}
              className="input-field text-xs"
            >
              <option value="">-- Choose Rabtakar --</option>
              {rabtakarCandidates.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.fullName} ({r.currentUnitId?.name})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Primary Daeen */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Primary Assigned Daeen *
            </label>
            <select
              required
              value={primaryDaeenId}
              onChange={(e) => setPrimaryDaeenId(e.target.value)}
              className="input-field text-xs"
            >
              <option value="">-- Choose Daeen --</option>
              {daeenCandidates.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Additional Daeen */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Additional Participating Daeen (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {daeenCandidates
                .filter((d) => d._id !== primaryDaeenId)
                .map((d) => {
                  const isSelected = additionalDaeenIds.includes(d._id);
                  return (
                    <button
                      key={d._id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setAdditionalDaeenIds(
                            additionalDaeenIds.filter((id) => id !== d._id)
                          );
                        } else {
                          setAdditionalDaeenIds([...additionalDaeenIds, d._id]);
                        }
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-brand-red text-white border-brand-red'
                          : 'bg-surface-secondary border-surface-border text-typography-main'
                      }`}
                    >
                      {d.fullName}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 6. Date & Meeting Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-typography-main mb-1">
                Meeting Date *
              </label>
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-typography-main mb-1">
                Meeting Number *
              </label>
              <input
                type="number"
                min={1}
                required
                value={meetingNumber}
                onChange={(e) => setMeetingNumber(parseInt(e.target.value, 10))}
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* 7. Comments */}
          <div>
            <label className="block text-xs font-semibold text-typography-main mb-1">
              Comments / Observations (Optional)
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Discussed core concepts, confirmed attendance for upcoming DF"
              className="input-field text-xs"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-xs font-semibold shadow-md mt-2"
          >
            {submitting ? 'Recording Meeting...' : 'Save Completed Meeting'}
          </button>
        </form>
      </div>
    </div>
  );
};
