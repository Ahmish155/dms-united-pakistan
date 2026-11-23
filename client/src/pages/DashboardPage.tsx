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
  MessageSquare,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  const [activityOverview, setActivityOverview] = useState<any | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const defaultEnd = new Date();
        const defaultStart = new Date();
        defaultStart.setDate(defaultStart.getDate() - 7);

        const startStr = defaultStart.toISOString().split('T')[0];
        const endStr = defaultEnd.toISOString().split('T')[0];

        const [overview, unitsData, meetingsData, reportData] =
          await Promise.all([
            ApiService.get<any>('/activity/overview'),
            ApiService.get<any[]>('/units'),
            ApiService.get<any[]>('/meetings'),
            ApiService.get<any>(
              `/reports/weekly?startDate=${startStr}&endDate=${endStr}`
            )
          ]);

        setActivityOverview(overview);
        setUnits(unitsData);
        setRecentMeetings(meetingsData.slice(0, 5));
        setWeeklyReport(reportData);
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeWorkspace) {
      fetchDashboard();
    }
  }, [activeWorkspace]);

  const counts = activityOverview?.counts || {
    totalMadu: 0,
    activeMadu: 0,
    inactiveMadu: 0,
    totalMdf: 0,
    activeMdf: 0,
    inactiveMdf: 0,
    totalRabtakar: 0,
    activeRabtakar: 0,
    inactiveRabtakar: 0
  };

  return (
    <div className="space-y-6">
      {/* Sector Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            {activeWorkspace ? activeWorkspace.name : 'Sector Overview'}
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Real-time Dawati operational monitoring and sector performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/meetings/new"
            className="btn-primary gap-1.5 text-xs py-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Record Meeting</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (Part 12.1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Madu Card */}
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-typography-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Madu</span>
            <Users className="h-4 w-4 text-brand-red" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-typography-main">
              {counts.totalMadu}
            </span>
            <span className="text-xs text-typography-secondary">total</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2 text-xs">
            <span className="flex items-center gap-1 text-status-success font-medium">
              <UserCheck className="h-3 w-3" /> {counts.activeMadu} Active
            </span>
            <span className="flex items-center gap-1 text-status-warning font-medium">
              <UserX className="h-3 w-3" /> {counts.inactiveMadu} Inactive
            </span>
          </div>
        </div>

        {/* MDF Card */}
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-typography-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">MDF</span>
            <TrendingUp className="h-4 w-4 text-brand-red" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-typography-main">
              {counts.totalMdf}
            </span>
            <span className="text-xs text-typography-secondary">total</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2 text-xs">
            <span className="flex items-center gap-1 text-status-success font-medium">
              <UserCheck className="h-3 w-3" /> {counts.activeMdf} Active
            </span>
            <span className="flex items-center gap-1 text-status-warning font-medium">
              <UserX className="h-3 w-3" /> {counts.inactiveMdf} Inactive
            </span>
          </div>
        </div>

        {/* Rabtakar Card */}
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-typography-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rabtakar</span>
            <UserCheck className="h-4 w-4 text-brand-red" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-typography-main">
              {counts.totalRabtakar}
            </span>
            <span className="text-xs text-typography-secondary">total</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2 text-xs">
            <span className="flex items-center gap-1 text-status-success font-medium">
              {counts.activeRabtakar} with active Madu
            </span>
            <span className="flex items-center gap-1 text-status-warning font-medium">
              {counts.inactiveRabtakar} inactive
            </span>
          </div>
        </div>

        {/* Weekly Activities Progress Card */}
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-typography-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">7-Day IMs</span>
            <CalendarCheck className="h-4 w-4 text-brand-red" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-red">
              {weeklyReport?.weekly?.ims || 0}
            </span>
            <span className="text-xs text-typography-secondary">completed</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2 text-xs text-typography-secondary">
            <span>DFs: <strong>{weeklyReport?.weekly?.dfs || 0}</strong></span>
            <span>GMs: <strong>{weeklyReport?.weekly?.gms || 0}</strong></span>
            <span>RMMs: <strong>{weeklyReport?.weekly?.rmms || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Units Performance */}
      <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-red" />
            <h2 className="text-sm font-semibold text-typography-main">Units Performance</h2>
          </div>
          <Link to="/units" className="text-xs font-medium text-brand-red hover:underline">
            View All Units
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {units.map((unit) => (
            <div key={unit._id} className="rounded-lg border border-surface-border p-3.5 bg-surface-secondary/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-typography-main">{unit.name}</span>
                <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-surface-border">
                  {unit.code}
                </span>
              </div>
              <div className="text-[11px] text-typography-secondary">
                <span>President: </span>
                <span className="font-medium text-typography-main">
                  {unit.presidentPersonId?.fullName || 'Unassigned'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Meetings */}
      <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-brand-red" />
            <h2 className="text-sm font-bold text-typography-main">Recent Meetings</h2>
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
                    ({m.unitId?.name})
                  </span>
                  <div className="text-[11px] text-typography-secondary">
                    Daeen: {m.primaryDaeenId?.fullName} • Meeting #{m.meetingNumber}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-typography-secondary">
                  {new Date(m.meetingDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
