import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ApiService } from '../services/api';
import {
  Users,
  UserCheck,
  UserX,
  Target,
  CalendarCheck,
  TrendingUp,
  Building2,
  Plus,
  Clock,
  CheckCircle2,
  Shield,
  Layers,
  MessageSquare,
  CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      const [dash, meetingsData] = await Promise.all([
        ApiService.get<any>(`/activity/dashboard?period=${selectedPeriod}`),
        ApiService.get<any[]>('/meetings')
      ]);
      setDashboardData(dash);
      setRecentMeetings(meetingsData.slice(0, 5));
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchDashboard(period);
    }
  }, [activeWorkspace, period]);

  const sector = dashboardData?.sector || {
    expectedMeetings: 0,
    heldMeetings: 0,
    totalImHeld: 0,
    totalDfHeld: 0,
    totalGmHeld: 0,
    totalRmmHeld: 0,
    completionRate: 0,
    activeRabtakar: 0,
    inactiveRabtakar: 0,
    totalRabtakar: 0,
    activeMadu: 0,
    inactiveMadu: 0,
    pipelineMadu: 0,
    freezedMadu: 0,
    droppedMadu: 0,
    totalMadu: 0,
    activeMdf: 0,
    inactiveMdf: 0,
    freezedMdf: 0,
    droppedMdf: 0,
    totalMdf: 0,
    activeDaeen: 0,
    inactiveDaeen: 0,
    totalDaeen: 0
  };

  const unitsList = dashboardData?.units || [];

  return (
    <div className="space-y-6">
      {/* Sector Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            {activeWorkspace ? activeWorkspace.name : 'Sector Overview'}
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Dawati operational monitoring, decoupled targets, and sector activity metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector Toggle */}
          <div className="inline-flex rounded-lg border border-surface-border bg-white p-0.5 shadow-sm text-xs">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                period === 'weekly'
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'text-typography-secondary hover:text-typography-main'
              }`}
            >
              Weekly Target (RMM)
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                period === 'monthly'
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'text-typography-secondary hover:text-typography-main'
              }`}
            >
              Monthly Target (DMM)
            </button>
          </div>

          <Link
            to="/meetings/new"
            className="btn-primary gap-1.5 text-xs py-1.5 px-3 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Record Meeting</span>
          </Link>
        </div>
      </div>

      {loading && !dashboardData ? (
        <div className="py-12 text-center text-xs text-typography-secondary">
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* SECTION 1: SESSIONS & ACTIVITIES HELD IN PERIOD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-typography-secondary uppercase tracking-wider">
                Sessions & Meetings Conducted ({period === 'weekly' ? 'Last 7 Days' : 'This Month'})
              </h2>
              <span className="text-[11px] text-typography-secondary font-medium">
                Scope: Sector-wide Aggregate
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* IMs Held */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-1">
                <div className="flex justify-between items-center text-[11px] font-semibold text-typography-secondary uppercase">
                  <span>IMs Held</span>
                  <CalendarCheck className="h-4 w-4 text-brand-red" />
                </div>
                <div className="text-2xl font-black text-brand-red">
                  {sector.totalImHeld || sector.heldMeetings || 0}
                </div>
                <div className="text-[10px] text-typography-secondary">Individual Meetings</div>
              </div>

              {/* DFs Held */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-1">
                <div className="flex justify-between items-center text-[11px] font-semibold text-typography-secondary uppercase">
                  <span>DFs Held</span>
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-600">
                  {sector.totalDfHeld || 0}
                </div>
                <div className="text-[10px] text-typography-secondary">Dialogue Forums</div>
              </div>

              {/* GMs Held */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-1">
                <div className="flex justify-between items-center text-[11px] font-semibold text-typography-secondary uppercase">
                  <span>GMs Held</span>
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-600">
                  {sector.totalGmHeld || 0}
                </div>
                <div className="text-[10px] text-typography-secondary">Group Meetings</div>
              </div>

              {/* RMMs Held */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-1">
                <div className="flex justify-between items-center text-[11px] font-semibold text-typography-secondary uppercase">
                  <span>RMMs Held</span>
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {sector.totalRmmHeld || 0}
                </div>
                <div className="text-[10px] text-typography-secondary">Weekly Planning Sessions</div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TARGET PROGRESS & HUMAN RESOURCE BREAKDOWN */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-typography-secondary uppercase tracking-wider">
              {period === 'weekly' ? 'Weekly Target Progress (RMM)' : 'Monthly Target Progress (DMM)'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Target vs Actual */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm col-span-1 sm:col-span-2 lg:col-span-1">
                <div className="text-[11px] font-semibold uppercase text-typography-secondary">
                  {period === 'weekly' ? 'Weekly IM Target' : 'Monthly IM Target'}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-brand-red">
                    {sector.heldMeetings}
                  </span>
                  <span className="text-xs text-typography-secondary">
                    / {sector.expectedMeetings} planned
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs border-t border-surface-border pt-1.5">
                  <span className="text-typography-secondary">Completion</span>
                  <span className="font-bold text-status-success">
                    {sector.completionRate}%
                  </span>
                </div>
              </div>

              {/* Madu Breakdown */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-typography-secondary">
                  <span>Madueen</span>
                  <Users className="h-3.5 w-3.5 text-brand-red" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-typography-main">{sector.activeMadu}</span>
                  <span className="text-xs text-status-success font-semibold">Active</span>
                  <span className="text-xs text-typography-secondary">/ {sector.totalMadu}</span>
                </div>
                <div className="text-[10px] text-typography-secondary border-t border-surface-border pt-1 flex flex-wrap gap-x-2">
                  <span>{sector.inactiveMadu} Inactive</span>
                  {sector.pipelineMadu > 0 && <span className="text-blue-600 font-medium">• {sector.pipelineMadu} Pipeline</span>}
                  {sector.freezedMadu > 0 && <span className="text-cyan-700 font-medium">• {sector.freezedMadu} Freezed</span>}
                  {sector.droppedMadu > 0 && <span className="text-gray-500">• {sector.droppedMadu} Dropped</span>}
                </div>
              </div>

              {/* MDF Breakdown */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-typography-secondary">
                  <span>MDF Contacts</span>
                  <TrendingUp className="h-3.5 w-3.5 text-brand-red" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-typography-main">{sector.activeMdf}</span>
                  <span className="text-xs text-status-success font-semibold">Active</span>
                  <span className="text-xs text-typography-secondary">/ {sector.totalMdf}</span>
                </div>
                <div className="text-[10px] text-typography-secondary border-t border-surface-border pt-1">
                  <span>{sector.inactiveMdf} Inactive</span>
                  {sector.freezedMdf > 0 && <span className="text-cyan-700 font-medium ml-1.5">• {sector.freezedMdf} Freezed</span>}
                  {sector.droppedMdf > 0 && <span className="text-gray-500 ml-1.5">• {sector.droppedMdf} Dropped</span>}
                </div>
              </div>

              {/* Rabtakar Breakdown */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-typography-secondary">
                  <span>Rabtakars</span>
                  <UserCheck className="h-3.5 w-3.5 text-brand-red" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-typography-main">{sector.activeRabtakar}</span>
                  <span className="text-xs text-status-success font-semibold">Active</span>
                  <span className="text-xs text-typography-secondary">/ {sector.totalRabtakar}</span>
                </div>
                <div className="text-[10px] text-typography-secondary border-t border-surface-border pt-1">
                  {sector.inactiveRabtakar} currently inactive
                </div>
              </div>

              {/* Daeen Breakdown (Sector Resource) */}
              <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-typography-secondary">
                  <span>Daeen</span>
                  <Shield className="h-3.5 w-3.5 text-brand-red" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-typography-main">{sector.activeDaeen}</span>
                  <span className="text-xs text-status-success font-semibold">Active</span>
                  <span className="text-xs text-typography-secondary">/ {sector.totalDaeen}</span>
                </div>
                <div className="text-[10px] text-typography-secondary border-t border-surface-border pt-1">
                  {sector.inactiveDaeen} currently inactive
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: UNIT PROGRESS & BREAKDOWN TABLE */}
          <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-red" />
                <h2 className="text-sm font-bold text-typography-main uppercase tracking-wide">
                  Unit-Wise Performance Breakdown
                </h2>
              </div>
              <span className="text-[11px] text-typography-secondary italic">
                Target: {period === 'weekly' ? 'Weekly RMM' : 'Monthly DMM'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary/70 text-typography-secondary border-b border-surface-border">
                  <tr>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Target IMs</th>
                    <th className="p-3">Held IMs</th>
                    <th className="p-3">DFs Held</th>
                    <th className="p-3">GMs Held</th>
                    <th className="p-3">RMMs Held</th>
                    <th className="p-3">Completion</th>
                    <th className="p-3">Active Rabtakars</th>
                    <th className="p-3">Madueen (Active / Total)</th>
                    <th className="p-3">MDF (Active / Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {unitsList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-4 text-center text-typography-muted italic">
                        No units found in this sector.
                      </td>
                    </tr>
                  ) : (
                    unitsList.map((u: any) => (
                      <tr key={u.unitId} className="hover:bg-gray-50">
                        <td className="p-3">
                          <span className="font-bold text-typography-main">{u.name}</span>
                          <span className="ml-1.5 text-[10px] font-mono uppercase text-typography-secondary bg-surface-secondary px-1.5 py-0.5 rounded">
                            {u.code}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-typography-secondary">
                          {u.expectedMeetings}
                        </td>
                        <td className="p-3 font-bold text-brand-red">
                          {u.heldMeetings}
                        </td>
                        <td className="p-3 font-medium text-blue-600">
                          {u.dfHeld || 0}
                        </td>
                        <td className="p-3 font-medium text-purple-600">
                          {u.gmHeld || 0}
                        </td>
                        <td className="p-3 font-medium text-emerald-600">
                          {u.rmmHeld || 0}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block font-semibold rounded px-1.5 py-0.5 text-[11px] ${
                              u.completionRate >= 100
                                ? 'bg-green-100 text-status-success'
                                : u.completionRate >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-typography-secondary'
                            }`}
                          >
                            {u.completionRate}%
                          </span>
                        </td>
                        <td className="p-3 font-medium text-typography-main">
                          <span className="text-status-success font-bold">{u.activeRabtakar}</span>
                          <span className="text-typography-secondary"> / {u.totalRabtakar}</span>
                        </td>
                        <td className="p-3 font-medium text-typography-main">
                          <span className="text-status-success font-bold">{u.activeMadu}</span>
                          <span className="text-typography-secondary"> / {u.totalMadu}</span>
                          {u.pipelineMadu > 0 && (
                            <span className="ml-1 text-[10px] text-blue-600">({u.pipelineMadu} pipe)</span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-typography-main">
                          <span className="text-status-success font-bold">{u.activeMdf}</span>
                          <span className="text-typography-secondary"> / {u.totalMdf}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: RECENT COMPLETED MEETINGS (NO MEETING NUMBER) */}
          <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-brand-red" />
                <h2 className="text-sm font-bold text-typography-main">Recent Completed Meetings</h2>
              </div>
              <Link to="/meetings" className="text-xs font-medium text-brand-red hover:underline">
                View All Meetings
              </Link>
            </div>

            {recentMeetings.length === 0 ? (
              <p className="text-xs text-typography-secondary py-3 italic">
                No completed meetings recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-surface-border">
                {recentMeetings.map((m) => (
                  <div key={m._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-typography-main">
                        {m.personId?.fullName}
                      </span>
                      <span className="text-typography-secondary ml-2">
                        ({m.unitId?.name || 'Sector'})
                      </span>
                      <div className="text-[11px] text-typography-secondary">
                        Rabtakar: {m.rabtakarId?.fullName || 'N/A'} • Daeen: {m.primaryDaeenId?.fullName || 'N/A'}
                        {m.comments && <span className="italic ml-2 text-typography-muted">"{m.comments}"</span>}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-typography-secondary whitespace-nowrap">
                      {new Date(m.meetingDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
