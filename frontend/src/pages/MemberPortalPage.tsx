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
  Users,
  ChevronDown
} from 'lucide-react';

export const MemberPortalPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const { user, isAdmin, isManager } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [statement, setStatement] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberSettlement, setMemberSettlement] = useState<any | null>(null);

  // Extract linked memberId from user if present
  const userMemberId = typeof user?.memberId === 'object' ? (user.memberId as any)._id : user?.memberId;

  // Load member list for admin/manager or fallback
  useEffect(() => {
    const initMembers = async () => {
      try {
        const memRes = await api.getMembers({ status: 'ACTIVE' });
        if (memRes.success && memRes.members?.length > 0) {
          setMembers(memRes.members);
          if (userMemberId) {
            setActiveMemberId(userMemberId);
          } else {
            // Default to first member for Admin/Manager
            setActiveMemberId(memRes.members[0]._id);
          }
        } else if (userMemberId) {
          setActiveMemberId(userMemberId);
        }
      } catch (err) {
        console.error('Failed to fetch members for portal:', err);
        if (userMemberId) {
          setActiveMemberId(userMemberId);
        }
      }
    };

    initMembers();
  }, [userMemberId]);

  // Fetch statement data whenever activeMemberId or selectedMonth changes
  const fetchPortalData = async (targetId: string) => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [stmtRes, setRes] = await Promise.all([
        api.getMemberStatement(selectedMonth, targetId),
        api.getMonthlySettlement(selectedMonth)
      ]);

      if (stmtRes.success) {
        setStatement(stmtRes);
      } else {
        setStatement(null);
      }

      if (setRes.success && setRes.settlement && setRes.settlement.memberSettlements) {
        const mySettlement = setRes.settlement.memberSettlements.find(
          (m: any) =>
            String(m.memberId || m.member?._id || m.member) === String(targetId)
        );
        setMemberSettlement(mySettlement || null);
      } else {
        setMemberSettlement(null);
      }
    } catch (err) {
      console.error('Failed to load member portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMemberId) {
      fetchPortalData(activeMemberId);
    }
  }, [selectedMonth, activeMemberId]);

  const currentMemberObj =
    statement?.member ||
    members.find((m) => m._id === activeMemberId);

  // Fallback when a regular member has no linked member profile
  if (!activeMemberId && !loading) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Member Profile Linked</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Your account is currently not linked to a Mess Resident ID. Please request your Mess Manager to link your profile under Member Management.
        </p>
      </div>
    );
  }

  const totalMeals = memberSettlement?.totalMeals || 0;
  const mealCost = memberSettlement?.mealCost || 0;
  const marketPaid = memberSettlement?.marketPaid || 0;
  const depositsPaid = memberSettlement?.depositsPaid || 0;
  const finalBalance = memberSettlement?.finalBalance || 0;
  const status = memberSettlement?.status || 'SETTLED';

  return (
    <div className="space-y-6">
      {/* Top Header & Member Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-widest">
              Personal Member Portal
            </span>
            {currentMemberObj?.memberCode && (
              <span className="px-2 py-0.5 rounded-md bg-brand-950/80 border border-brand-800/60 text-[10px] font-mono font-bold text-brand-300">
                {currentMemberObj.memberCode}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            {currentMemberObj?.name || user?.name || 'Member Portal'}
          </h1>
          <p className="text-xs text-slate-400">
            Confidential summary of individual meals, bazar contributions, and billing status for {selectedMonth}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Member Switcher Dropdown for Admin and Manager */}
          {(isAdmin || isManager) && members.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
              <Users className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <label htmlFor="member-select" className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Viewing Member:
              </label>
              <select
                id="member-select"
                value={activeMemberId}
                onChange={(e) => setActiveMemberId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id} className="bg-slate-950 text-slate-100">
                    {m.name} ({m.memberCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm ml-auto sm:ml-0"
          >
            <Printer className="w-4 h-4 text-brand-400" />
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
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-amber-300 font-semibold">Total Meals</span>
                <Utensils className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{totalMeals}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Meal Cost: ৳{mealCost}</div>
            </div>

            {/* Bazar Spent */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-purple-300 font-semibold">Bazar Paid</span>
                <ShoppingCart className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300 font-mono">৳{marketPaid}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Direct financial credit</div>
            </div>

            {/* Deposits Paid */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-emerald-300 font-semibold">Deposits Paid</span>
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
              <div className="text-[10px] text-slate-400 mt-0.5">Net statement balance</div>
            </div>
          </div>

          {/* Itemized Meal Diary & Receipts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily meal history */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-brand-400" />
                Daily Meal Diary ({selectedMonth})
              </h3>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 text-xs">
                {!statement?.itemizedMeals || statement.itemizedMeals.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No meals logged for this member this month.</p>
                ) : (
                  statement.itemizedMeals.map((m: any) => (
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

            {/* Deposits & Bazar history */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Deposits & Bazar Receipts ({selectedMonth})
              </h3>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 text-xs">
                {(!statement?.itemizedDeposits || statement.itemizedDeposits.length === 0) &&
                (!statement?.itemizedMarket || statement.itemizedMarket.length === 0) ? (
                  <p className="py-6 text-center text-slate-500">No deposits or bazar transactions logged this month.</p>
                ) : (
                  <>
                    {statement?.itemizedDeposits?.map((d: any) => (
                      <div key={d._id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-200">Deposit ({d.paymentMethod})</span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {d.date} • {d.transactionId || 'Cash Voucher'}
                          </div>
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
