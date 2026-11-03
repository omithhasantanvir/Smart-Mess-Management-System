import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Building2,
  Menu,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { format, addMonths, subMonths, parse } from 'date-fns';
import { api } from '../../services/api';

interface NavbarProps {
  currentMonth: string;
  onMonthChange: (m: string) => void;
  onToggleSidebar: () => void;
  messName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonth,
  onMonthChange,
  onToggleSidebar,
  messName = 'Green View Smart Mess'
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [estMillRate, setEstMillRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuickRate = async () => {
      try {
        const res = await api.getDashboardOverview();
        if (res.success && res.summaryCards?.currentMillRate !== undefined) {
          setEstMillRate(res.summaryCards.currentMillRate);
        }
      } catch (err) {
        // Silently ignore ticker fetch
      }
    };
    fetchQuickRate();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    try {
      const curr = parse(currentMonth, 'yyyy-MM', new Date());
      const prev = subMonths(curr, 1);
      onMonthChange(format(prev, 'yyyy-MM'));
    } catch (e) {}
  };

  const handleNextMonth = () => {
    try {
      const curr = parse(currentMonth, 'yyyy-MM', new Date());
      const next = addMonths(curr, 1);
      onMonthChange(format(next, 'yyyy-MM'));
    } catch (e) {}
  };

  let formattedMonthLabel = currentMonth;
  try {
    const d = parse(currentMonth, 'yyyy-MM', new Date());
    formattedMonthLabel = format(d, 'MMMM yyyy');
  } catch (e) {}

  return (
    <header className="h-16 bg-white dark:bg-[#0f192e] border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 shadow-sm">
      {/* Left section: Mobile menu trigger + Mess Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 items-center justify-center text-brand-600 dark:text-brand-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {messName}
              </h2>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
              Month: <span className="text-slate-700 dark:text-slate-200 font-medium">{formattedMonthLabel}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center & Right: Month Stepper + Theme Toggle + Quick Stat */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Mill Rate pill ticker */}
        {estMillRate !== null && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              Mill Rate:
            </span>
            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
              ৳{estMillRate.toFixed(2)}
            </span>
          </div>
        )}

        {/* Calm Month Stepper */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-0.5">
          <button
            onClick={handlePrevMonth}
            title="Previous Month"
            className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative px-2 flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white font-medium focus:outline-none cursor-pointer w-28 text-center text-xs"
            />
          </div>

          <button
            onClick={handleNextMonth}
            title="Next Month"
            className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-xs font-medium"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-brand-600" />
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-700">Dark</span>
            </>
          )}
        </button>

        {/* Currency Badge */}
        <div className="hidden lg:flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span className="font-mono text-brand-600 dark:text-brand-400">৳ BDT</span>
        </div>

        {/* Dedicated Logout Button in Header */}
        <button
          onClick={logout}
          title="Sign Out of Mess System"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
