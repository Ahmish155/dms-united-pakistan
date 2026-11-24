import React, { useState } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import {
  X,
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
  Sparkles
} from 'lucide-react';

const mobileNavLinks = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'AI Assistant', path: '/ai', icon: Sparkles },
  { label: 'People Directory', path: '/people', icon: Users },
  { label: 'Individual Meetings', path: '/meetings', icon: CalendarCheck },
  { label: 'DMM Monthly Planning', path: '/dmm', icon: Target },
  { label: 'RMM Weekly Planning', path: '/rmm', icon: CalendarDays },
  { label: 'Activities (DF & GM)', path: '/activities', icon: MessageSquare },
  { label: 'Analytics & Insights', path: '/analytics', icon: BarChart3 },
  { label: 'Reporting & Exports', path: '/reports', icon: FileText },
  { label: 'Units Management', path: '/units', icon: Building2 },
  { label: 'Settings & Spectators', path: '/settings', icon: Settings },
];

export const AppLayout: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
          <span className="text-xs font-medium text-typography-secondary">
            Loading United Pakistan DMS...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 pb-20 md:pb-8 p-4 md:p-6 max-w-7xl mx-auto w-full">
          {!activeWorkspace && !wsLoading && location.pathname !== '/admin' ? (
            <div className="rounded-xl border border-surface-border bg-white p-6 text-center max-w-md mx-auto mt-12 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-typography-main">
                No Sector Workspace Selected
              </h3>
              <p className="text-xs text-typography-secondary">
                You do not currently have access to an active Sector Workspace. If you are a Secretary Dawat or Super Admin, you can open the admin console or create a workspace.
              </p>
              {user?.systemRole === 'SUPER_ADMIN' && (
                <div className="pt-2 border-t border-surface-border">
                  <NavLink
                    to="/admin"
                    className="inline-flex items-center gap-1.5 btn-primary text-xs py-2 px-3"
                  >
                    Open Super Admin Console
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-4/5 max-w-xs flex-col bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <span className="font-bold text-sm text-typography-main">Navigation Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1 text-typography-secondary hover:bg-surface-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
              {mobileNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium ${
                        isActive
                          ? 'bg-brand-red-light font-semibold text-brand-red'
                          : 'text-typography-main hover:bg-surface-secondary'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
