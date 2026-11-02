import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Percent,
  Calculator,
  Utensils,
  ShoppingCart,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const MillRatePage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const [loading, setLoading] = useState(true);
  const [settlementData, setSettlementData] = useState<any | null>(null);
  const [dashboardData, setDashboardData] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setRes, dashRes] = await Promise.all([
        api.getMonthlySettlement(selectedMonth),
        api.getDashboardOverview()
      ]);

      if (setRes.success) setSettlementData(setRes.settlement);
      if (dashRes.success) setDashboardData(dashRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  if (loading && !settlementData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const eligibleExpenses = settlementData?.eligibleMealExpenses || 0;
  const totalMessMeals = settlementData?.totalMessMeals || 0;
  const calculatedRate = settlementData?.calculatedMillRate || 0;
  const isFinalized = settlementData?.status === 'LOCKED';

  // Last 6 months rate history
  const rateHistory = dashboardData?.charts?.last6Months?.map((m: any) => ({
    month: m.label,
    rate: m.millRate,
    meals: m.meals,
    expenses: m.market
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Mill Rate Automation & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time calculation engine: Total Eligible Meal Cost ÷ Total Mess Meals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isFinalized
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {isFinalized ? 'Finalized Locked Rate' : 'Live Estimated Rate'}
          </span>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Mill Rate Formula Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-950 via-slate-900 to-slate-950 border border-brand-800/40 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400 mb-2">
            <Calculator className="w-4 h-4" />
            Mathematical Meal Rate Equation ({selectedMonth})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-4">
            {/* Step 1: Eligible expenses */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Eligible Meal Cost</span>
              <div className="text-2xl font-extrabold text-white font-mono mt-1">
                ৳{eligibleExpenses.toLocaleString()}
              </div>
              <span className="text-[10px] text-purple-400">Total Bazar Shopping</span>
            </div>

            {/* Division sign */}
            <div className="hidden md:flex justify-center text-slate-500 font-mono text-2xl font-black">
              ÷
            </div>

            {/* Step 2: Total mess meals */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Total Mess Meals</span>
              <div className="text-2xl font-extrabold text-white font-mono mt-1">
                {totalMessMeals.toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-400">Across all active members</span>
            </div>
          </div>

          {/* Equals Result Box */}
          <div className="mt-6 p-4 rounded-2xl bg-brand-900/30 border border-brand-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-brand-300 font-semibold">Active Mill Rate:</div>
              <div className="text-4xl font-black text-white font-mono tracking-tight mt-0.5">
                ৳{calculatedRate.toFixed(2)}
                <span className="text-sm font-normal text-slate-400 ml-2">/ meal</span>
              </div>
            </div>
            <div className="text-xs text-slate-300 max-w-sm text-right sm:text-right">
              Every meal consumed by a member incurs exactly <strong className="text-white">৳{calculatedRate.toFixed(2)}</strong> deducted from their financial credits.
            </div>
          </div>
        </div>
      </div>

      {/* 6 Months Mill Rate Trend Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Mill Rate Historical Curve</h3>
            <p className="text-xs text-slate-400">Historical trend of monthly meal rate changes</p>
          </div>
          <span className="text-xs text-brand-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Automated Tracking
          </span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rateHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="৳" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                formatter={(val: any) => [`৳${val}`, 'Mill Rate']}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#38a9f7"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0e8ce9' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rules Explanatory Box */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-400" />
          Financial Rules Reference (from MEAL.xlsx)
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li>Daily Bazar expenses automatically feed into the eligible meal expense pool.</li>
          <li>House rent, electricity, gas, and cook bills are tracked separately under Shared Bills and not blended into the meal rate unless configured in settings.</li>
          <li>Whenever a manager adds or edits daily meals or grocery receipts, the mill rate updates in real-time.</li>
          <li>At Month Closing, this rate is finalized and stamped onto all member voucher statements.</li>
        </ul>
      </div>
    </div>
  );
};

