import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardOverview } from '../types';
import {
  Users,
  Utensils,
  SunMedium,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Home,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  PlusCircle,
  Sparkles,
  Receipt,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export const DashboardPage: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({
  onNavigateTab
}) => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardOverview();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-9 h-9 text-brand-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium tracking-wide">
            Syncing live mess financials...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-red-950/30 border border-red-800/60 text-red-200 max-w-xl mx-auto my-12 text-center shadow-2xl">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Error Loading Financial Dashboard</h3>
        <p className="text-xs text-red-300 mt-1">{error || 'Unknown network error occurred.'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-5 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-900/40"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summaryCards, charts, recentMarket, recentDeposits, membersWithDues } = data;

  // Calculation for financial health bar
  const totalMessExpenses = summaryCards.totalMarketExpenses + summaryCards.totalHouseExpenses;
  const netCashFlow = summaryCards.currentMonthTotalDeposits - totalMessExpenses;
  const burnPercent = summaryCards.currentMonthTotalDeposits > 0
    ? Math.min(100, Math.round((totalMessExpenses / summaryCards.currentMonthTotalDeposits) * 100))
    : 0;

  const cards = [
    {
      title: 'Current Mill Rate',
      value: `৳${summaryCards.currentMillRate.toFixed(2)}`,
      icon: TrendingUp,
      accent: 'from-amber-500 to-amber-600',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      sub: 'Per individual meal',
      tabTarget: 'millrate'
    },
    {
      title: 'Meals This Month',
      value: summaryCards.totalMealsThisMonth,
      icon: Utensils,
      accent: 'from-brand-500 to-indigo-600',
      badgeColor: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
      sub: `Today: ${summaryCards.todaysTotalMeals} meals`,
      tabTarget: 'meals'
    },
    {
      title: 'Active Residents',
      value: summaryCards.totalActiveMembers,
      icon: Users,
      accent: 'from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      sub: 'Active mess members',
      tabTarget: 'members'
    },
    {
      title: 'Total Deposits',
      value: `৳${summaryCards.currentMonthTotalDeposits.toLocaleString()}`,
      icon: Wallet,
      accent: 'from-teal-500 to-emerald-600',
      badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
      sub: 'Collected this month',
      tabTarget: 'deposits'
    },
    {
      title: 'Market Shopping',
      value: `৳${summaryCards.totalMarketExpenses.toLocaleString()}`,
      icon: ShoppingCart,
      accent: 'from-purple-500 to-violet-600',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      sub: 'Bazar & groceries',
      tabTarget: 'bazar'
    },
    {
      title: 'House Shared Bills',
      value: `৳${summaryCards.totalHouseExpenses.toLocaleString()}`,
      icon: Home,
      accent: 'from-sky-500 to-blue-600',
      badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      sub: 'Rent, bills & cook',
      tabTarget: 'house'
    },
    {
      title: "Today's Meals",
      value: summaryCards.todaysTotalMeals,
      icon: SunMedium,
      accent: 'from-orange-500 to-amber-600',
      badgeColor: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
      sub: data.todayStr || 'Logged today',
      tabTarget: 'meals'
    },
    {
      title: 'Outstanding Dues',
      value: `৳${summaryCards.totalOutstandingBalance.toLocaleString()}`,
      icon: AlertCircle,
      accent: 'from-rose-500 to-pink-600',
      badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      sub: `${membersWithDues.length} members with dues`,
      tabTarget: 'settlement'
    }
  ];

  return (
    <div className="space-y-7 pb-10">
      {/* Top Banner: Greeting + Quick Action Shortcuts */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 p-6 rounded-3xl glass-panel relative overflow-hidden shadow-2xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Monthly Financial Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Financial Health Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Live mess metrics, automated meal calculation, and financial settlements for{' '}
            <span className="text-slate-200 font-bold">{data.currentMonth}</span>.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 w-full lg:w-auto">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('meals')}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-600/30"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Daily Meals</span>
              </button>
              <button
                onClick={() => onNavigateTab('bazar')}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/25"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Record Bazar</span>
              </button>
              <button
                onClick={() => onNavigateTab('deposits')}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/25"
              >
                <Wallet className="w-4 h-4" />
                <span>Add Deposit</span>
              </button>
            </>
          )}

          <button
            onClick={fetchDashboard}
            disabled={loading}
            title="Refresh All Dashboard Data"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition shadow-sm ml-auto sm:ml-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Health / Cash Flow Bar */}
      <div className="p-5 rounded-3xl glass-card flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Net Mess Fund (Cash in Hand)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netCashFlow >= 0 ? `+৳${netCashFlow.toLocaleString()}` : `-৳${Math.abs(netCashFlow).toLocaleString()}`}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                (Deposits: ৳{summaryCards.currentMonthTotalDeposits.toLocaleString()} — Spent: ৳{totalMessExpenses.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar of budget utilization */}
        <div className="w-full md:w-72">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-400">Mess Fund Spent</span>
            <span className={burnPercent > 90 ? 'text-rose-400' : 'text-slate-200'}>{burnPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                burnPercent > 90
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-brand-500 to-emerald-400'
              }`}
              style={{ width: `${burnPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 8 Primary Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigateTab && onNavigateTab(c.tabTarget)}
              className="p-5 rounded-3xl glass-card glass-card-hover cursor-pointer relative group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 tracking-tight">{c.title}</span>
                <div
                  className={`p-2.5 rounded-2xl bg-gradient-to-br ${c.accent} text-white shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {c.value}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 truncate">{c.sub}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Deposit vs Expense Trend */}
        <div className="p-6 rounded-3xl glass-card shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Deposit vs Mess Expenses
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of member deposits against bazar and house bills
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Last 6 Months
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.depositVsExpenses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `৳${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`৳${value}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                <Bar dataKey="deposits" name="Deposits" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Member-wise Meal Consumption */}
        <div className="p-6 rounded-3xl glass-card shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Member-wise Meal Consumption
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total meals consumed per member for current month
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-brand-950/80 text-brand-300 border border-brand-800/60">
              Live Meals
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.memberMeals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-25} textAnchor="end" height={40} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    fontSize: '12px'
                  }}
                  formatter={(val: any) => [`${val} Meals`, 'Total Meals']}
                />
                <Bar dataKey="meals" name="Meals" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Bazar, Outstanding Dues & Recent Deposits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bazar Shopping */}
        <div className="p-6 rounded-3xl glass-card shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-purple-400" />
                Recent Bazar Purchases
              </h3>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('bazar')}
                  className="text-[11px] font-bold text-brand-400 hover:text-brand-300 transition"
                >
                  View All
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recentMarket.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No bazar logged yet.</p>
              ) : (
                recentMarket.map((m: any) => (
                  <div
                    key={m._id}
                    className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-200">
                        {m.purchasedBy?.name || 'Member'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {m.date} • {m.category}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-purple-300">
                      ৳{m.totalAmount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Outstanding Dues Attention */}
        <div className="p-6 rounded-3xl glass-card shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Members with Dues
              </h3>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('settlement')}
                  className="text-[11px] font-bold text-brand-400 hover:text-brand-300 transition"
                >
                  Settlement
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {membersWithDues.length === 0 ? (
                <div className="text-center py-8 text-emerald-400 font-medium text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <span>All member accounts are fully settled!</span>
                </div>
              ) : (
                membersWithDues.map((m: any) => (
                  <div
                    key={m.memberId}
                    className="p-3 rounded-2xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-100">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {m.roomNumber ? `Room ${m.roomNumber}` : 'Resident'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-rose-400 block">
                        ৳{m.currentBalance}
                      </span>
                      <span className="text-[9px] font-bold text-rose-400/80 uppercase">
                        Unpaid Due
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="p-6 rounded-3xl glass-card shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Latest Deposits
              </h3>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('deposits')}
                  className="text-[11px] font-bold text-brand-400 hover:text-brand-300 transition"
                >
                  View All
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recentDeposits.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No deposits recorded yet.</p>
              ) : (
                recentDeposits.map((d: any) => (
                  <div
                    key={d._id}
                    className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-200">
                        {d.member?.name || 'Member'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {d.date} • {d.paymentMethod}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      +৳{d.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
