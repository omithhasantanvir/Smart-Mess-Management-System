import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Member } from '../types';
import {
  User,
  Utensils,
  Wallet,
  ShoppingCart,
  Receipt,
  Printer,
  AlertCircle,
  RefreshCw,
  Users
} from 'lucide-react';

export const MemberPortalPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const { user, isAdmin, isManager } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [statement, setStatement] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [memberSettlement, setMemberSettlement] = useState<any | null>(null);

  // Extract linked memberId from current user
  const userMemberId =
    typeof user?.memberId === 'object' ? (user.memberId as any)?._id : user?.memberId;

  // Initial load: Fetch members list and set starting activeMemberId
  useEffect(() => {
    let isMounted = true;

    const setupMembers = async () => {
      try {
        const memRes = await api.getMembers({ status: 'ACTIVE' });
        if (!isMounted) return;

        if (memRes.success && memRes.members && memRes.members.length > 0) {
          setMembers(memRes.members);
          // Prefer user's own linked memberId if exists, otherwise first member from list
          if (userMemberId) {
            setActiveMemberId(userMemberId);
          } else {
            setActiveMemberId(memRes.members[0]._id);
          }
        } else if (userMemberId) {
          setActiveMemberId(userMemberId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load active members:', err);
        if (isMounted) {
          if (userMemberId) {
            setActiveMemberId(userMemberId);
          } else {
            setLoading(false);
          }
        }
      }
    };

    setupMembers();

    return () => {
      isMounted = false;
    };
  }, [userMemberId]);

  // Load statement whenever activeMemberId or selectedMonth changes
  useEffect(() => {
    if (!activeMemberId) return;

    let isMounted = true;
    const fetchPortalData = async () => {
      setLoading(true);
      try {
        const [stmtRes, setRes] = await Promise.all([
          api.getMemberStatement(selectedMonth, activeMemberId).catch(() => ({ success: false })),
          api.getMonthlySettlement(selectedMonth).catch(() => ({ success: false }))
        ]);

        if (!isMounted) return;

        if (stmtRes && stmtRes.success) {
          setStatement(stmtRes);
        } else {
          setStatement(null);
        }

        if (setRes && setRes.success && setRes.settlement && setRes.settlement.memberSettlements) {
          const mySettlement = setRes.settlement.memberSettlements.find(
            (m: any) =>
              String(m.memberId || m.member?._id || m.member) === String(activeMemberId)
          );
          setMemberSettlement(mySettlement || null);
        } else {
          setMemberSettlement(null);
        }
      } catch (err) {
        console.error('Error fetching portal data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPortalData();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, activeMemberId]);

  const currentMemberObj =
    statement?.member || members.find((m) => m._id === activeMemberId);

  // If no member is active and loading is finished
  if (!activeMemberId && !loading) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Member Selected</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Your account is currently not linked to a Mess Resident ID. Please request your Mess Manager to link your profile under Member Management.
        </p>
      </div>
    );
  }

  const totalMeals = memberSettlement?.totalMeals ?? (statement?.itemizedMeals?.reduce((acc: number, m: any) => acc + (m.totalMeals || 0), 0) || 0);
  const mealCost = memberSettlement?.mealCost ?? 0;
  const marketPaid = memberSettlement?.marketPaid ?? (statement?.itemizedMarket?.reduce((acc: number, m: any) => acc + (m.totalAmount || 0), 0) || 0);
  const depositsPaid = memberSettlement?.depositsPaid ?? (statement?.itemizedDeposits?.reduce((acc: number, d: any) => acc + (d.amount || 0), 0) || 0);
  const finalBalance = memberSettlement?.finalBalance ?? 0;
  const status = memberSettlement?.status ?? (finalBalance > 0 ? 'TO_PAY' : finalBalance < 0 ? 'TO_RECEIVE' : 'SETTLED');

  return (
    <div className="space-y-6">
      {/* Top Header & Member Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
              Personal Member Portal
            </span>
            {currentMemberObj?.memberCode && (
              <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800/60 text-[10px] font-mono font-bold text-brand-700 dark:text-brand-300">
                {currentMemberObj.memberCode}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {currentMemberObj?.name || user?.name || 'Member Portal'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confidential summary of individual meals, bazar contributions, and billing status for {selectedMonth}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Member Switcher Dropdown for Admin and Manager */}
          {(isAdmin || isManager) && members.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
              <Users className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <label htmlFor="member-select" className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                Viewing Member:
              </label>
              <select
                id="member-select"
                value={activeMemberId}
                onChange={(e) => setActiveMemberId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer pr-1"
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id} className="bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
                    {m.name} ({m.memberCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-sm ml-auto sm:ml-0"
          >
            <Printer className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Print Voucher</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* 4 Financial Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Meals */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Meals</span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
                  <Utensils className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{totalMeals}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Meal Cost: ৳{mealCost}</div>
              </div>
            </div>

            {/* Bazar Spent */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bazar Paid</span>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono tracking-tight">৳{marketPaid}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Direct financial credit</div>
              </div>
            </div>

            {/* Deposits Paid */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Deposits Paid</span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">৳{depositsPaid}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cash / Online transfers</div>
              </div>
            </div>

            {/* Current Net Balance */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {finalBalance > 0 ? 'Due to Pay' : finalBalance < 0 ? 'Refund Advance' : 'Settled'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    finalBalance > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                      : finalBalance < 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div>
                <div
                  className={`text-2xl font-bold font-mono tracking-tight ${
                    finalBalance > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : finalBalance < 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  ৳{Math.abs(finalBalance)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Net statement balance</div>
              </div>
            </div>
          </div>

          {/* Itemized Meal Diary & Receipts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily meal history */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Daily Meal Diary ({selectedMonth})
              </h3>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {!statement?.itemizedMeals || statement.itemizedMeals.length === 0 ? (
                  <p className="py-6 text-center text-slate-400">No meals logged for this member this month.</p>
                ) : (
                  statement.itemizedMeals.map((m: any) => (
                    <div key={m._id} className="py-2.5 flex items-center justify-between font-mono">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{m.date}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                          (B:{m.breakfast} L:{m.lunch} D:{m.dinner} G:{m.guestMeal})
                        </span>
                      </div>
                      <span className="font-bold text-brand-600 dark:text-brand-400">{m.totalMeals} Meals</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Deposits & Bazar history */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Deposits & Bazar Receipts ({selectedMonth})
              </h3>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {(!statement?.itemizedDeposits || statement.itemizedDeposits.length === 0) &&
                (!statement?.itemizedMarket || statement.itemizedMarket.length === 0) ? (
                  <p className="py-6 text-center text-slate-400">No deposits or bazar transactions logged this month.</p>
                ) : (
                  <>
                    {statement?.itemizedDeposits?.map((d: any) => (
                      <div key={d._id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Deposit ({d.paymentMethod})</span>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {d.date} • {d.transactionId || 'Cash Voucher'}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+৳{d.amount}</span>
                      </div>
                    ))}
                    {statement?.itemizedMarket?.map((m: any) => (
                      <div key={m._id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Bazar: {m.category}</span>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{m.date}</div>
                        </div>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">+৳{m.totalAmount}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
