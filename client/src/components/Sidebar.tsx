import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SystemRole } from '@dms/shared';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Target,
  CalendarDays,
  MessageSquare,
  BarChart3,
  FileText,
  Building2,
  Settings,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'AI Assistant', path: '/ai', icon: Sparkles },
  { label: 'People', path: '/people', icon: Users },
  { label: 'Individual Meetings', path: '/meetings', icon: CalendarCheck },
  { label: 'DMM Planning', path: '/dmm', icon: Target },
  { label: 'RMM Planning', path: '/rmm', icon: CalendarDays },
  { label: 'Activities (DF & GM)', path: '/activities', icon: MessageSquare },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Units', path: '/units', icon: Building2 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.systemRole === SystemRole.SUPER_ADMIN;

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-surface-border bg-white p-3 min-h-[calc(100vh-3.5rem)]">
      <div className="space-y-1">
        {isSuperAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold mb-2 transition-colors ${
                isActive
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`
            }
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Super Admin Console</span>
          </NavLink>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-red-light font-semibold text-brand-red'
                    : 'text-typography-main hover:bg-surface-secondary'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
