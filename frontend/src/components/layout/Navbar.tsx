import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Calendar, Bell, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface NavbarProps {
  currentMonth: string;
  onMonthChange: (m: string) => void;
  onToggleSidebar: () => void;
  messName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonth,
  onMonthChange,
  messName = 'Smart Mess'
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-brand-500/20">
            🍲
          </div>
          <span className="font-bold text-lg text-white hidden sm:inline tracking-tight">
            {messName}
          </span>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-2 hidden sm:block" />

        {/* Month selector pill */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs sm:text-sm text-slate-300">
          <Calendar className="w-4 h-4 text-brand-400" />
          <span className="text-slate-400 font-medium">Period:</span>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 text-brand-300 border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          {user?.role}
        </div>

        {/* User profile pill */}
        <div className="flex items-center gap-2 bg-slate-800/60 pl-3 pr-2 py-1.5 rounded-lg border border-slate-700/60">
          <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-semibold text-xs">
            {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
          </div>
          <span className="text-sm font-medium text-slate-200 hidden md:inline">
            {user?.name}
          </span>
          <button
            onClick={logout}
            title="Log out"
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

