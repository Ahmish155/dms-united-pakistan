import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { LogOut, Shield, ChevronDown, Check } from 'lucide-react';
import { WorkspaceRole } from '@dms/shared';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, activeRole, setActiveWorkspaceId } = useWorkspace();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-surface-border bg-white px-4 md:px-6">
      {/* Brand & Active Workspace */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red text-white font-bold text-sm shadow-sm">
            UP
          </div>
          <span className="font-bold text-typography-main text-base hidden sm:inline">
            United Pakistan <span className="text-xs font-normal text-typography-secondary">DMS</span>
          </span>
        </div>

        {/* Workspace Selector */}
        {workspaces.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-secondary px-2.5 py-1 text-xs font-medium text-typography-main hover:bg-gray-100 transition-colors"
            >
              <span className="truncate max-w-[120px] sm:max-w-[200px]">
                {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
              </span>
              <ChevronDown className="h-3 w-3 text-typography-secondary" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1 w-56 rounded-lg border border-surface-border bg-white p-1 shadow-lg z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-typography-muted uppercase tracking-wider">
                  Sectors
                </div>
                {workspaces.map((m) => {
                  const wsId = m.workspace?.id || (m.workspace as any)?._id;
                  const activeId = activeWorkspace?.id || (activeWorkspace as any)?._id;
                  const isSelected = wsId === activeId;
                  return (
                    <button
                      key={wsId}
                      onClick={() => {
                        setActiveWorkspaceId(wsId);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left ${
                        isSelected
                          ? 'bg-brand-red-light font-semibold text-brand-red'
                          : 'text-typography-main hover:bg-surface-secondary'
                      }`}
                    >
                      <span>{m.workspace.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-brand-red" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User profile & Role Badge */}
      <div className="flex items-center gap-3">
        {activeRole && (
          <span
            className={`hidden md:inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              activeRole === WorkspaceRole.SECTOR_SECRETARY
                ? 'bg-red-50 text-brand-red border border-red-200'
                : 'bg-gray-100 text-typography-secondary border border-gray-200'
            }`}
          >
            <Shield className="h-3 w-3 mr-1" />
            {activeRole === WorkspaceRole.SECTOR_SECRETARY
              ? 'Secretary Dawat'
              : 'Spectator'}
          </span>
        )}

        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-typography-main leading-none">
            {user?.name}
          </div>
          <div className="text-[10px] text-typography-secondary leading-tight mt-0.5">
            {user?.email}
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="rounded-lg p-1.5 text-typography-secondary hover:bg-surface-secondary hover:text-brand-red transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
