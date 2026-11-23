import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Users,
  UserCheck,
  UserX,
  Target,
  CalendarCheck,
  TrendingUp,
  Building2,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="space-y-6">
      {/* Sector Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            {activeWorkspace ? activeWorkspace.name : 'Sector Overview'}
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Dawati executive management & operational activity monitor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/meetings/new"
            className="btn-primary gap-1.5 text-xs py-2"
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
            <span className="text-2xl font-bold text-typography-main">24</span>
            <span className="text-xs text-typography-secondary">total</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2 text-xs">
            <span className="flex items-center gap-1 text-status-success font-medium">
              <UserCheck className="h-3 w-3" /> 18 Active
            </span>
            <span className="flex items-center gap-1 text-status-warning font-medium">
              <UserX className="h-3 w-3" /> 6 Inactive
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
            <span className="text-2xl font-bold text-typography-main">12</span>
            <span className="text-xs text-typography-secondary">total</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2 text-xs">
            <span className="flex items-center gap-1 text-status-success font-medium">
              <UserCheck className="h-3 w-3" /> 9 Active
            </span>
            <span className="flex items-center gap-1 text-status-warning font-medium">
              <UserX className="h-3 w-3" /> 3 Inactive
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
            <span className="text-2xl font-bold text-typography-main">8</span>
            <span className="text-xs text-typography-secondary">total</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-2 text-xs">
            <span className="flex items-center gap-1 text-status-success font-medium">
              7 with active Madu
            </span>
            <span className="flex items-center gap-1 text-status-warning font-medium">
              1 inactive
            </span>
          </div>
        </div>

        {/* Monthly Target Completion */}
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-typography-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">DMM Target</span>
            <Target className="h-4 w-4 text-brand-red" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-typography-main">68%</span>
            <span className="text-xs text-typography-secondary">34 / 50 IMs</span>
          </div>
          <div className="mt-3 w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
            <div className="bg-brand-red h-full rounded-full" style={{ width: '68%' }} />
          </div>
        </div>
      </div>

      {/* Units Quick Breakdown */}
      <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-red" />
            <h2 className="text-sm font-semibold text-typography-main">Units Performance</h2>
          </div>
          <Link to="/units" className="text-xs font-medium text-brand-red hover:underline">
            View All Units
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {['Morgah', 'Lalkurti', 'Comsats', 'Hostel City'].map((unit) => (
            <div key={unit} className="rounded-lg border border-surface-border p-3 bg-surface-secondary/40">
              <div className="font-semibold text-xs text-typography-main">{unit}</div>
              <div className="mt-2 text-[11px] text-typography-secondary space-y-1">
                <div className="flex justify-between">
                  <span>Madu / MDF:</span>
                  <span className="font-medium text-typography-main">6 / 3</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly IMs:</span>
                  <span className="font-medium text-typography-main">9 completed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
