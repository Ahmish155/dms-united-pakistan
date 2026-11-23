import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, Users, CalendarCheck } from 'lucide-react';

const COLORS = ['#C62828', '#16845B', '#D99021', '#4A90E2'];

export const AnalyticsPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [activityOverview, setActivityOverview] = useState<any | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overview, unitsData, meetingsData] = await Promise.all([
          ApiService.get<any>('/activity/overview'),
          ApiService.get<any[]>('/units'),
          ApiService.get<any[]>('/meetings')
        ]);
        setActivityOverview(overview);
        setUnits(unitsData);
        setMeetings(meetingsData);
      } catch (err: any) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeWorkspace) {
      fetchData();
    }
  }, [activeWorkspace]);

  // Unit Meetings Data for Chart
  const unitMeetingsData = units.map((u) => {
    const count = meetings.filter((m) => m.unitId?._id === u._id).length;
    return {
      name: u.name,
      meetings: count
    };
  });

  // People Stage Distribution
  const counts = activityOverview?.counts || {};
  const statusDistribution = [
    { name: 'Active Madu', value: counts.activeMadu || 0 },
    { name: 'Inactive Madu', value: counts.inactiveMadu || 0 },
    { name: 'Active MDF', value: counts.activeMdf || 0 },
    { name: 'Inactive MDF', value: counts.inactiveMdf || 0 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-typography-main">
          Sector Analytics & Trends
        </h1>
        <p className="text-xs text-typography-secondary mt-0.5">
          Verifiable metrics, unit comparisons, and active/inactive health breakdown for {activeWorkspace?.name}
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-typography-secondary">
          Loading analytics...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unit Comparison Chart */}
          <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-red" />
              <h2 className="text-sm font-bold text-typography-main">
                Completed Meetings by Unit
              </h2>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitMeetingsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '11px',
                      border: '1px solid #E8E8E8'
                    }}
                  />
                  <Bar dataKey="meetings" fill="#C62828" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active vs Inactive Stage Distribution */}
          <div className="rounded-xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-red" />
              <h2 className="text-sm font-bold text-typography-main">
                People Activity Status Health
              </h2>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
