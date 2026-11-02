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
  CreditCard
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
  CartesianGrid
} from 'recharts';

export const DashboardPage: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
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
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading live financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-950/40 border border-red-800 text-red-200">
        <div className="flex items-center gap-2 mb-2 font-bold">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>Error Loading Dashboard</span>
        </div>
        <p className="text-sm text-red-300">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summaryCards, charts, recentMarket, recentDeposits, membersWithDues } = data;

  const cards = [
    {
      title: 'Active Members',
      value: summaryCards.totalActiveMembers,
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-400',
      sub: 'Currently in mess'
    },
    {
      title: 'Meals This Month',
      value: summaryCards.totalMealsThisMonth,
      icon: Utensils,
      color: 'from-amber-600 to-orange-600',
      textColor: 'text-amber-400',
      sub: `Today: ${summaryCards.todaysTotalMeals} meals`
    },
    {
      title: "Today's Meals",
      value: summaryCards.todaysTotalMeals,
      icon: SunMedium,
      color: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-400',
      sub: `${data.todayStr}`
    },
    {
      title: 'Current Mill Rate',
      value: `৳${summaryCards.currentMillRate.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-brand-600 to-cyan-600',
      textColor: 'text-brand-400',
      sub: 'Per individual meal'
    },
    {
      title: 'Market Expenses',
      value: `৳${summaryCards.totalMarketExpenses.toLocaleString()}`,
      icon: ShoppingCart,
      color: 'from-purple-600 to-pink-600',
      textColor: 'text-purple-400',
      sub: 'Groceries & Bazar'
    },
    {
      title: 'Total Deposits',
      value: `৳${summaryCards.currentMonthTotalDeposits.toLocaleString()}`,
      icon: Wallet,
      color: 'from-emerald-600 to-green-600',
      textColor: 'text-emerald-400',
      sub: 'Received this month'
    },
    {
      title: 'House Expenses',
      value: `৳${summaryCards.totalHouseExpenses.toLocaleString()}`,
      icon: Home,
      color: 'from-sky-600 to-blue-600',
      textColor: 'text-sky-400',
      sub: 'Rent, Bills & Cook'
    },
    {
      title: 'Outstanding Dues',
      value: `৳${summaryCards.totalOutstandingBalance.toLocaleString()}`,
      icon: AlertCircle,
      color: 'from-rose-600 to-red-600',
      textColor: 'text-rose-400',
      sub: `${membersWithDues.length} members with dues`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Financial Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time mess performance, mill rates, and member settlements for {data.currentMonth}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 8 Primary Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-medium text-slate-400">{c.title}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${c.color} text-white shadow-md shadow-slate-950/50`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">{c.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{c.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Meal Consumption */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Daily Meal Consumption</h2>
              <p className="text-xs text-slate-400">Total daily meals served in mess this month</p>
            </div>
            <span className="text-xs font-bold text-brand-400 bg-brand-950/60 border border-brand-800/40 px-2.5 py-1 rounded-lg">
              {summaryCards.totalMealsThisMonth} Total Meals
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.dailyMealConsumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="meals"
                  name="Meals"
                  stroke="#0e8ce9"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0e8ce9' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Member-wise Meal Comparison */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Member-wise Meal Comparison</h2>
              <p className="text-xs text-slate-400">Total meals consumed per member this month</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.memberMealComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="meals" name="Meals" fill="#38a9f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Last 6 Months Deposit vs Expenses Overview */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">6 Months Financial Overview</h2>
            <p className="text-xs text-slate-400">Deposits collected vs Total mess expenses (Market + House Bills)</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="deposit" name="Deposits (৳)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalExpense" name="Total Expenses (৳)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="market" name="Market Only (৳)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Lists: Recent Bazar, Deposits, and Members with Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Market / Bazar */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-purple-400" />
              Recent Bazar Purchases
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('bazar')}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300"
              >
                View All
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {recentMarket.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent market purchases.</p>
            ) : (
              recentMarket.map((t) => (
                <div
                  key={t._id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">
                      {typeof t.purchasedBy === 'object' ? t.purchasedBy?.name : 'Member'}
                    </div>
                    <div className="text-[10px] text-slate-500">{t.date} • {t.category}</div>
                  </div>
                  <span className="font-bold text-purple-400 font-mono">৳{t.totalAmount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Recent Member Deposits
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('deposits')}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300"
              >
                View All
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {recentDeposits.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent deposits.</p>
            ) : (
              recentDeposits.map((d) => (
                <div
                  key={d._id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">
                      {typeof d.member === 'object' ? d.member?.name : 'Member'}
                    </div>
                    <div className="text-[10px] text-slate-500">{d.date} • {d.paymentMethod}</div>
                  </div>
                  <span className="font-bold text-emerald-400 font-mono">+৳{d.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Members with Dues
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('settlement')}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300"
              >
                Settlement
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {membersWithDues.length === 0 ? (
              <p className="text-xs text-emerald-400 py-4 text-center font-medium">
                All members are fully settled! No outstanding dues.
              </p>
            ) : (
              membersWithDues.map((m) => (
                <div
                  key={m.memberId}
                  className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{m.name}</div>
                    <div className="text-[10px] text-slate-500">{m.memberCode} • {m.phone}</div>
                  </div>
                  <span className="font-bold text-rose-400 font-mono">৳{m.dueAmount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

