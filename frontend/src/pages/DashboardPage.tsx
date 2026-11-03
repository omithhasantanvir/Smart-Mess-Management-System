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
  PlusCircle,
  CreditCard,
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
  CartesianGrid
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading mess overview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-md mx-auto my-10">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-white">Failed to Load Dashboard</h3>
        <p className="text-xs text-slate-400 mt-1">{error || 'Please check your connection.'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summaryCards, charts, recentMarket, recentDeposits, membersWithDues } = data;

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
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      sub: 'Per individual meal',
      tabTarget: 'millrate'
    },
    {
      title: 'Meals This Month',
      value: summaryCards.totalMealsThisMonth,
      icon: Utensils,
      color: 'text-brand-400',
      bgColor: 'bg-brand-400/10',
      sub: `Today: ${summaryCards.todaysTotalMeals} meals`,
      tabTarget: 'meals'
    },
    {
      title: 'Active Residents',
      value: summaryCards.totalActiveMembers,
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
      sub: 'Active mess members',
      tabTarget: 'members'
    },
    {
      title: 'Total Deposits',
      value: `৳${summaryCards.currentMonthTotalDeposits.toLocaleString()}`,
      icon: Wallet,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      sub: 'Collected this month',
      tabTarget: 'deposits'
    },
    {
      title: 'Market Expenses',
      value: `৳${summaryCards.totalMarketExpenses.toLocaleString()}`,
      icon: ShoppingCart,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      sub: 'Bazar & groceries',
      tabTarget: 'bazar'
    },
    {
      title: 'House Shared Bills',
      value: `৳${summaryCards.totalHouseExpenses.toLocaleString()}`,
      icon: Home,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
      sub: 'Rent, bills & cook',
      tabTarget: 'house'
    },
    {
      title: "Today's Meals",
      value: summaryCards.todaysTotalMeals,
      icon: SunMedium,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      sub: data.todayStr || 'Logged today',
      tabTarget: 'meals'
    },
    {
      title: 'Outstanding Dues',
      value: `৳${summaryCards.totalOutstandingBalance.toLocaleString()}`,
      icon: AlertCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
      sub: `${membersWithDues.length} members with dues`,
      tabTarget: 'settlement'
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner: Greeting + Action Shortcuts */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111a2e] border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of mess meals, bazar expenses, and accounts for{' '}
            <span className="text-slate-200 font-semibold">{data.currentMonth}</span>
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('meals')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Meals</span>
              </button>
              <button
                onClick={() => onNavigateTab('bazar')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />
                <span>Record Bazar</span>
              </button>
              <button
                onClick={() => onNavigateTab('deposits')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Deposit</span>
              </button>
            </>
          )}

          <button
            onClick={fetchDashboard}
            disabled={loading}
            title="Refresh Data"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition ml-auto sm:ml-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="p-4 rounded-2xl bg-[#131d33] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
            <CreditCard className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Mess Cash in Hand
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-xl font-bold font-mono ${
                  netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netCashFlow >= 0 ? `+৳${netCashFlow.toLocaleString()}` : `-৳${Math.abs(netCashFlow).toLocaleString()}`}
              </span>
              <span className="text-xs text-slate-400">
                (Deposits: ৳{summaryCards.currentMonthTotalDeposits.toLocaleString()} | Spent: ৳{totalMessExpenses.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Budget bar */}
        <div className="w-full md:w-64">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Budget Spent</span>
            <span className="font-semibold text-slate-200">{burnPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                burnPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${burnPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 8 Primary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigateTab && onNavigateTab(c.tabTarget)}
              className="p-4 rounded-xl bg-[#131d33] hover:bg-[#17233d] border border-slate-800/80 transition-colors cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">{c.title}</span>
                <div className={`p-2 rounded-lg ${c.bgColor} ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">
                  {c.value}
                </div>
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span className="truncate">{c.sub}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Deposit vs Expense */}
        <div className="p-5 rounded-2xl bg-[#111a2e] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Deposit vs Mess Expenses</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly deposits against all mess expenses</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              6 Months
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.depositVsExpenses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `৳${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(val: any) => [`৳${val}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                <Bar dataKey="deposits" name="Deposits" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Member-wise Meals */}
        <div className="p-5 rounded-2xl bg-[#111a2e] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Member Meals Comparison</h3>
              <p className="text-xs text-slate-400 mt-0.5">Individual meal count for current month</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Meals
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.memberMeals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-20} textAnchor="end" height={35} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(val: any) => [`${val} Meals`, 'Total Meals']}
                />
                <Bar dataKey="meals" name="Meals" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom 3 Columns: Recent Bazar, Outstanding Dues, Recent Deposits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Bazar Shopping */}
        <div className="p-5 rounded-2xl bg-[#111a2e] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-purple-400" />
                Recent Bazar Shopping
              </h3>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('bazar')}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {recentMarket.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No bazar logged yet.</p>
              ) : (
                recentMarket.map((m: any) => (
                  <div
                    key={m._id}
                    className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800/80 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-200">
                        {m.purchasedBy?.name || 'Member'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {m.date} • {m.category}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-purple-300">
                      ৳{m.totalAmount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="p-5 rounded-2xl bg-[#111a2e] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Members with Dues
              </h3>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('settlement')}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  Settlement
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {membersWithDues.length === 0 ? (
                <div className="text-center py-6 text-emerald-400 text-xs flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>All accounts are settled!</span>
                </div>
              ) : (
                membersWithDues.map((m: any) => (
                  <div
                    key={m.memberId}
                    className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-200">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {m.roomNumber ? `Room ${m.roomNumber}` : 'Resident'}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-rose-400">
                      ৳{m.currentBalance}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="p-5 rounded-2xl bg-[#111a2e] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Latest Deposits
              </h3>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('deposits')}
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {recentDeposits.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No deposits recorded yet.</p>
              ) : (
                recentDeposits.map((d: any) => (
                  <div
                    key={d._id}
                    className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800/80 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-200">
                        {d.member?.name || 'Member'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {d.date} • {d.paymentMethod}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-400">
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
