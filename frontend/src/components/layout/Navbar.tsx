import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Building2,
  Menu,
  Wallet
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
  const { user } = useAuth();
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

  // Stepper handlers
  const handlePrevMonth = () => {
    try {
      const curr = parse(currentMonth, 'yyyy-MM', new Date());
      const prev = subMonths(curr, 1);
      onMonthChange(format(prev, 'yyyy-MM'));
    } catch (e) {
      // fallback
    }
  };

  const handleNextMonth = () => {
    try {
      const curr = parse(currentMonth, 'yyyy-MM', new Date());
      const next = addMonths(curr, 1);
      onMonthChange(format(next, 'yyyy-MM'));
    } catch (e) {
      // fallback
    }
  };

  const handleThisMonth = () => {
    onMonthChange(format(new Date(), 'yyyy-MM'));
  };

  let formattedMonthLabel = currentMonth;
  try {
    const d = parse(currentMonth, 'yyyy-MM', new Date());
    formattedMonthLabel = format(d, 'MMMM yyyy');
  } catch (e) {}

  return (
    <header className="h-20 bg-[#080c16]/90 backdrop-blur-xl border-b border-slate-800/60 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left section: Mobile menu trigger + Mess Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500/20 to-indigo-500/20 border border-brand-500/30 items-center justify-center text-brand-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none">
                {messName}
              </h2>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
              Financial Period: <span className="text-slate-200 font-semibold">{formattedMonthLabel}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center & Right: Month Stepper + Quick Stat */}
      <div className="flex items-center gap-3">
        {/* Quick Mill Rate pill ticker */}
        {estMillRate !== null && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Mill Rate
            </span>
            <span className="text-xs font-mono font-black text-amber-300">
              ৳{estMillRate.toFixed(2)}
            </span>
          </div>
        )}

        {/* Elegant Month Stepper */}
        <div className="flex items-center bg-slate-900/90 border border-slate-700/60 rounded-xl p-1 shadow-inner">
          <button
            onClick={handlePrevMonth}
            title="Previous Month"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative px-2 flex items-center gap-2 text-xs font-bold text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-brand-400" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer w-28 text-center text-xs"
            />
          </div>

          <button
            onClick={handleNextMonth}
            title="Next Month"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Currency Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
          <span className="font-mono text-brand-400">৳ BDT</span>
        </div>
      </div>
    </header>
  );
};
