import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Utensils,
  Wallet,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export const MemberPortalPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const { user } = useAuth();
  const [statement, setStatement] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberSettlement, setMemberSettlement] = useState<any | null>(null);

  const memberId = typeof user?.memberId === 'object' ? (user.memberId as any)._id : user?.memberId;

  const fetchPortalData = async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [stmtRes, setRes] = await Promise.all([
        api.getMemberStatement(selectedMonth, memberId),
        api.getMonthlySettlement(selectedMonth)
      ]);

      if (stmtRes.success) {
        setStatement(stmtRes);
      }
      if (setRes.success && setRes.settlement) {
        const mySettlement = setRes.settlement.memberSettlements.find(
          (m: any) => m.member === memberId || m.memberId === memberId
        );
        setMemberSettlement(mySettlement);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [selectedMonth, memberId]);

  if (!memberId) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-white">No Member Profile Linked</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Your user login is not linked to an active member ID. Please ask a Manager or Administrator to link your member profile.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const totalMeals = memberSettlement?.totalMeals || 0;
  const mealCost = memberSettlement?.mealCost || 0;
  const sharedBills = memberSettlement?.sharedBills || 0;
  const marketPaid = memberSettlement?.marketPaid || 0;
  const depositsPaid = memberSettlement?.depositsPaid || 0;
  const finalBalance = memberSettlement?.finalBalance || 0;
  const status = memberSettlement?.status || 'SETTLED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-widest">
            Personal Member Portal
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-400">
            Confidential summary of your individual meals, bazar contributions, and billing status for {selectedMonth}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <Printer className="w-4 h-4 text-brand-400" />
          <span>Print Voucher</span>
        </button>
      </div>

      {/* 4 Hero Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Meals */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-amber-300 font-semibold">My Total Meals</span>
            <Utensils className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalMeals}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Meal Cost: ৳{mealCost}</div>
        </div>

        {/* Bazar Spent */}
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-purple-300 font-semibold">My Bazar Paid</span>
            <ShoppingCart className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">৳{marketPaid}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Direct financial credit</div>
        </div>

        {/* Deposits Paid */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-emerald-300 font-semibold">My Deposits</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">৳{depositsPaid}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cash / Online transfers</div>
        </div>

        {/* Current Net Balance */}
        <div
          className={`p-4 rounded-2xl border ${
            finalBalance > 0
              ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
              : finalBalance < 0
              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">
              {finalBalance > 0 ? 'Due to Pay' : finalBalance < 0 ? 'Refund Advance' : 'Settled'}
            </span>
            <span className="text-[10px] font-bold uppercase">{status}</span>
          </div>
          <div className="text-2xl font-black font-mono">৳{Math.abs(finalBalance)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Net final statement balance</div>
        </div>
      </div>

      {/* Itemized Meal Diary & Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily meal history */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-brand-400" />
            My Daily Meal History ({selectedMonth})
          </h3>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 text-xs">
            {statement?.itemizedMeals?.length === 0 ? (
              <p className="py-6 text-center text-slate-500">No meals logged for you this month.</p>
            ) : (
              statement?.itemizedMeals?.map((m: any) => (
                <div key={m._id} className="py-2.5 flex items-center justify-between font-mono">
                  <div>
                    <span className="font-semibold text-slate-200">{m.date}</span>
                    <span className="text-[10px] text-slate-500 ml-2">
                      (B:{m.breakfast} L:{m.lunch} D:{m.dinner} G:{m.guestMeal})
                    </span>
                  </div>
                  <span className="font-bold text-brand-400">{m.totalMeals} Meals</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Bazar & Deposits history */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            My Deposits & Bazar Receipts
          </h3>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 text-xs">
            {statement?.itemizedDeposits?.map((d: any) => (
              <div key={d._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">Deposit ({d.paymentMethod})</span>
                  <div className="text-[10px] text-slate-500 font-mono">{d.date} • {d.transactionId || 'Cash'}</div>
                </div>
                <span className="font-mono font-bold text-emerald-400">+৳{d.amount}</span>
              </div>
            ))}
            {statement?.itemizedMarket?.map((m: any) => (
              <div key={m._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">Bazar: {m.category}</span>
                  <div className="text-[10px] text-slate-500 font-mono">{m.date}</div>
                </div>
                <span className="font-mono font-bold text-purple-400">+৳{m.totalAmount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

