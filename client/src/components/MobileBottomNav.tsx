import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  FileText,
  Menu
} from 'lucide-react';

export const MobileBottomNav: React.FC<{ onOpenMenu: () => void }> = ({
  onOpenMenu
}) => {
  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-surface-border bg-white px-2 md:hidden">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-brand-red font-semibold' : 'text-typography-secondary'
          }`
        }
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/people"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-brand-red font-semibold' : 'text-typography-secondary'
          }`
        }
      >
        <Users className="h-5 w-5" />
        <span>People</span>
      </NavLink>

      {/* Quick Action Meeting Logger */}
      <NavLink
        to="/meetings/new"
        className="flex -mt-5 flex-col items-center justify-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-red text-white shadow-lg active:scale-95 transition-transform">
          <PlusCircle className="h-7 w-7" />
        </div>
        <span className="text-[10px] font-semibold text-brand-red mt-1">Record IM</span>
      </NavLink>

      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-brand-red font-semibold' : 'text-typography-secondary'
          }`
        }
      >
        <FileText className="h-5 w-5" />
        <span>Reports</span>
      </NavLink>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-typography-secondary"
      >
        <Menu className="h-5 w-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
