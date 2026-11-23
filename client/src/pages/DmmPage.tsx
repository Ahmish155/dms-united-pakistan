import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Building2,
  Share2,
  Copy
} from 'lucide-react';
import { DmmStatus, PersonStage, WorkspaceRole } from '@dms/shared';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DmmPage: React.FC = () => {
  const { activeWorkspace, activeRole } = useWorkspace();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [dmmData, setDmmData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dmmsList, setDmmsList] = useState<any[]>([]);

  // Add Target Modal
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  const [modalUnitId, setModalUnitId] = useState('');
  const [modalPersonId, setModalPersonId] = useState('');
  const [modalTargetMeetings, setModalTargetMeetings] = useState<number>(3);
  const [modalRabtakarId, setModalRabtakarId] = useState('');
  const [modalDaeenId, setModalDaeenId] = useState('');
  const [modalCategory, setModalCategory] = useState<PersonStage>(PersonStage.MADU);

  const [expectedMsc, setExpectedMsc] = useState<number>(0);
  const [expectedMdf, setExpectedMdf] = useState<number>(0);

  const fetchDmmData = async () => {
    try {
      setLoading(true);
      const list = await ApiService.get<any[]>(`/dmm?year=${selectedYear}`);
      setDmmsList(list);

      const currentDmm = list.find(
        (d) => d.month === selectedMonth && d.year === selectedYear
      );

      if (currentDmm) {
        const variance = await ApiService.get<any>(`/dmm/${currentDmm._id}/variance`);
        setDmmData(variance);
        setExpectedMsc(currentDmm.expectedMscCount || 0);
        setExpectedMdf(currentDmm.expectedMdfCount || 0);
      } else {
        setDmmData(null);
      }
    } catch (err: any) {
      console.error('Failed to load DMM data:', err);
    } finally {
      setLoading(false);
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
      fetchDmmData();
      fetchPrerequisites();
    }
  }, [activeWorkspace, selectedMonth, selectedYear]);

  const handlePersonSelect = (personId: string) => {
    setModalPersonId(personId);
    const p = people.find((x) => x._id === personId);
    if (p) {
      setModalCategory(p.currentStage || PersonStage.MADU);
      if (p.currentUnitId?._id) setModalUnitId(p.currentUnitId._id);
      if (p.primaryRabtakarId?._id) setModalRabtakarId(p.primaryRabtakarId._id);
      if (p.defaultDaeenId?._id) setModalDaeenId(p.defaultDaeenId._id);
    }
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.post('/dmm', {
        month: selectedMonth,
        year: selectedYear,
        status: DmmStatus.DRAFT,
        expectedMscCount: expectedMsc,
        expectedMdfCount: expectedMdf,
        targets: [
          {
            unitId: modalUnitId,
            personId: modalPersonId,
            targetMeetings: modalTargetMeetings,
            rabtakarId: modalRabtakarId,
            daeenId: modalDaeenId,
            category: modalCategory
          }
        ]
      });

      setTargetModalOpen(false);
      setModalPersonId('');
      await fetchDmmData();
    } catch (err: any) {
      alert(err.message || 'Failed to save DMM target');
    }
  };

  const copyWhatsAppSummary = () => {
    if (!dmmData) return;
    const { summary, unitConclusions } = dmmData;

    let text = `*DMM Plan & Progress (${MONTH_NAMES[selectedMonth - 1]} ${selectedYear})*\n`;
    text += `Sector: ${activeWorkspace?.name}\n`;
    text += `Target IMs: ${summary.sectorTotalTarget} | Actual: ${summary.sectorTotalActual} (${summary.sectorCompletionPercentage}%)\n`;
    text += `Expected Promotions: MSC: ${summary.expectedMscCount} | MDF: ${summary.expectedMdfCount}\n\n`;

    unitConclusions.forEach((u: any) => {
      text += `*Unit ${u.unitName}* (Target: ${u.totalTargetMeetings} | Actual: ${u.totalActualMeetings})\n`;
      u.targets.forEach((t: any) => {
        text += `- ${t.personId?.fullName} (${t.category}): Target ${t.targetMeetings} | Done ${t.actualMeetings} (RBT: ${t.rabtakarId?.fullName})\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    alert('Copied DMM conclusion to clipboard in WhatsApp format!');
  };

  const isSecretary = activeRole === WorkspaceRole.SECTOR_SECRETARY;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            DMM: Monthly Dawati Planning
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Monthly target management and actual meeting comparisons for {activeWorkspace?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dmmData && (
            <button
              onClick={copyWhatsAppSummary}
              className="btn-secondary gap-1.5 text-xs py-2"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy WhatsApp</span>
            </button>
          )}

          {isSecretary && (
            <button
              onClick={() => setTargetModalOpen(true)}
              className="btn-primary gap-1.5 text-xs py-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add / Edit Target</span>
            </button>
          )}
        </div>
      </div>

      {/* Month & Year Selectors */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-surface-border text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-brand-red" />
          <span className="font-semibold text-typography-main">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="input-field text-xs py-1 w-32"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-typography-main">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="input-field text-xs py-1 w-24"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DMM Overview & Variance */}
      {loading ? (
        <div className="py-12 text-center text-xs text-typography-secondary">
          Loading DMM planning data...
        </div>
      ) : !dmmData ? (
        <div className="rounded-xl border border-surface-border bg-white p-8 text-center space-y-3">
          <Target className="mx-auto h-8 w-8 text-typography-muted" />
          <h3 className="text-sm font-semibold text-typography-main">
            No DMM Planned for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h3>
          <p className="text-xs text-typography-secondary max-w-sm mx-auto">
            At the beginning of each month, record the individual meeting targets for each unit to track monthly progress.
          </p>
          {isSecretary && (
            <button
              onClick={() => setTargetModalOpen(true)}
              className="btn-primary text-xs py-2 inline-flex"
            >
              Start DMM Planning
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Sector Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-typography-secondary uppercase">
                Sector Target IMs
              </span>
              <div className="text-2xl font-bold text-typography-main mt-1">
                {dmmData.summary.sectorTotalTarget}
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-typography-secondary uppercase">
                Actual Completed IMs
              </span>
              <div className="text-2xl font-bold text-brand-red mt-1">
                {dmmData.summary.sectorTotalActual}
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-typography-secondary uppercase">
                Remaining Target
              </span>
              <div className="text-2xl font-bold text-typography-main mt-1">
                {dmmData.summary.sectorTotalRemaining}
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-typography-secondary uppercase">
                Completion Rate
              </span>
              <div className="text-2xl font-bold text-status-success mt-1">
                {dmmData.summary.sectorCompletionPercentage}%
              </div>
            </div>
          </div>

          {/* Promotion Expectations */}
          <div className="rounded-xl border border-surface-border bg-white p-4 flex gap-6 text-xs shadow-sm">
            <div>
              <span className="text-typography-secondary">Expected MSC Promotions:</span>
              <span className="ml-2 font-bold text-typography-main">
                {dmmData.summary.expectedMscCount}
              </span>
            </div>
            <div>
              <span className="text-typography-secondary">Expected MDF Promotions:</span>
              <span className="ml-2 font-bold text-typography-main">
                {dmmData.summary.expectedMdfCount}
              </span>
            </div>
          </div>

          {/* Unit-wise Conclusions */}
          <div className="space-y-4">
            {dmmData.unitConclusions.map((unitGroup: any) => (
              <div
                key={unitGroup.unitId}
                className="rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden"
              >
                {/* Unit Header */}
                <div className="bg-surface-secondary/80 p-3.5 border-b border-surface-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand-red" />
                    <span className="font-bold text-sm text-typography-main">
                      Unit {unitGroup.unitName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>
                      Target: <strong>{unitGroup.totalTargetMeetings}</strong>
                    </span>
                    <span>
                      Actual: <strong className="text-brand-red">{unitGroup.totalActualMeetings}</strong>
                    </span>
                    <span className="badge-active text-[10px]">
                      {unitGroup.completionPercentage}% achieved
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-typography-secondary border-b border-surface-border">
                      <tr>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">T.M (Target)</th>
                        <th className="p-2.5">Actual IM</th>
                        <th className="p-2.5">Remaining</th>
                        <th className="p-2.5">Completion</th>
                        <th className="p-2.5">Rabtakar (RBT)</th>
                        <th className="p-2.5">Daeen (DAE)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {unitGroup.targets.map((t: any) => (
                        <tr key={t._id} className="hover:bg-gray-50">
                          <td className="p-2.5">
                            <span className="rounded bg-brand-red-light px-1.5 py-0.5 text-[10px] font-semibold text-brand-red">
                              {t.category}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-typography-main">
                            {t.personId?.fullName}
                          </td>
                          <td className="p-2.5 font-semibold text-center">{t.targetMeetings}</td>
                          <td className="p-2.5 font-bold text-center text-brand-red">
                            {t.actualMeetings}
                          </td>
                          <td className="p-2.5 text-center text-typography-secondary">
                            {t.remainingMeetings}
                          </td>
                          <td className="p-2.5 font-semibold text-center">
                            {t.completionPercentage}%
                          </td>
                          <td className="p-2.5">{t.rabtakarId?.fullName}</td>
                          <td className="p-2.5">{t.daeenId?.fullName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Target Modal */}
      {targetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-surface-border bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-typography-main">
              Set DMM Target ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
            </h3>

            <form onSubmit={handleSaveTarget} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Select Person *
                </label>
                <select
                  required
                  value={modalPersonId}
                  onChange={(e) => handlePersonSelect(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">-- Choose person --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.currentStage}) — {p.currentUnitId?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-main mb-1">
                  Target Meetings (T.M) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={modalTargetMeetings}
                  onChange={(e) => setModalTargetMeetings(parseInt(e.target.value, 10))}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Rabtakar (RBT) *
                  </label>
                  <select
                    required
                    value={modalRabtakarId}
                    onChange={(e) => setModalRabtakarId(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="">-- Rabtakar --</option>
                    {people.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-typography-main mb-1">
                    Daeen (DAE) *
                  </label>
                  <select
                    required
                    value={modalDaeenId}
                    onChange={(e) => setModalDaeenId(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="">-- Daeen --</option>
                    {people.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setTargetModalOpen(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
