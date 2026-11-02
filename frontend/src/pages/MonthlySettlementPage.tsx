import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MonthlySettlementSummary, MemberSettlement } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Calculator,
  Lock,
  Unlock,
  Printer,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  FileText,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export const MonthlySettlementPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const { isAdmin } = useAuth();
  const [settlement, setSettlement] = useState<MonthlySettlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [closingMonth, setClosingMonth] = useState(false);

  // Individual statement voucher modal
  const [statementModalMember, setStatementModalMember] = useState<MemberSettlement | null>(null);
  const [memberStatementDetails, setMemberStatementDetails] = useState<any | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Month closing wizard modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [overrideRate, setOverrideRate] = useState<number | undefined>(undefined);

  const fetchSettlement = async () => {
    try {
      setLoading(true);
      const res = await api.getMonthlySettlement(selectedMonth);
      if (res.success) {
        setSettlement(res.settlement);
        setIsLocked(res.isLocked);
        if (res.settlement.appliedMillRate) {
          setOverrideRate(res.settlement.appliedMillRate);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
  }, [selectedMonth]);

  const handleOpenCloseModal = () => {
    setIsCloseModalOpen(true);
  };

  const handleConfirmCloseMonth = async () => {
    setClosingMonth(true);
    try {
      const res = await api.closeMonth({
        month: selectedMonth,
        notes: closeNotes,
        overrideMillRate: overrideRate
      });
      if (res.success) {
        setIsCloseModalOpen(false);
        fetchSettlement();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to close month.');
    } finally {
      setClosingMonth(false);
    }
  };

  const handleReopenMonth = async () => {
    if (!confirm(`Are you sure you want to reopen ${selectedMonth}? This will unlock financial transactions.`)) return;
    try {
      const res = await api.reopenMonth(selectedMonth);
      if (res.success) {
        fetchSettlement();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reopen month.');
    }
  };

  const handleViewStatement = async (ms: MemberSettlement) => {
    setStatementModalMember(ms);
    setLoadingStatement(true);
    try {
      const res = await api.getMemberStatement(selectedMonth, ms.member);
      if (res.success) {
        setMemberStatementDetails(res);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingStatement(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    window.open(`/api/reports/settlement/excel?month=${selectedMonth}`, '_blank');
  };

  if (loading && !settlement) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Monthly Financial Settlement</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isLocked
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {isLocked ? 'LOCKED / FINALIZED' : 'LIVE / OPEN'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Automated member ledger calculation, credits balancing, and closing system for {selectedMonth}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          {isLocked ? (
            isAdmin && (
              <button
                onClick={handleReopenMonth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold border border-amber-600/50 transition"
              >
                <Unlock className="w-4 h-4" />
                <span>Reopen Month (Admin)</span>
              </button>
            )
          ) : (
            <button
              onClick={handleOpenCloseModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Finalize & Close Month</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      {settlement && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">Mess Meals</span>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{settlement.totalMessMeals}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Bazar</span>
            <div className="text-xl font-black text-purple-400 font-mono mt-0.5">৳{settlement.totalMarketCost}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">Mill Rate</span>
            <div className="text-xl font-black text-brand-400 font-mono mt-0.5">৳{settlement.appliedMillRate.toFixed(2)}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">House Bills</span>
            <div className="text-xl font-black text-sky-400 font-mono mt-0.5">৳{settlement.totalSharedExpenses}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">Cook Salary</span>
            <div className="text-xl font-black text-amber-300 font-mono mt-0.5">৳{settlement.totalCookBill}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Deposits</span>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">৳{settlement.totalDeposits}</div>
          </div>
        </div>
      )}

      {/* Main Settlement Table (Exactly matching user prompt requirements) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Member Name</th>
                <th className="py-3.5 px-4 font-bold text-center">Total Meals</th>
                <th className="py-3.5 px-4 font-bold text-right">Meal Cost (৳)</th>
                <th className="py-3.5 px-4 font-bold text-right">Shared Bills (৳)</th>
                <th className="py-3.5 px-4 font-bold text-right">Total Cost (৳)</th>
                <th className="py-3.5 px-4 font-bold text-right text-purple-400">Market Paid (৳)</th>
                <th className="py-3.5 px-4 font-bold text-right text-emerald-400">Deposit (৳)</th>
                <th className="py-3.5 px-4 font-bold text-right">Prev Due (৳)</th>
                <th className="py-3.5 px-4 font-bold text-right">Final Balance (৳)</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {!settlement || settlement.memberSettlements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                    No active members found for this month settlement.
                  </td>
                </tr>
              ) : (
                settlement.memberSettlements.map((m) => (
                  <tr key={m.member} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-100">{m.memberName}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-400">{m.totalMeals}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">৳{m.mealCost.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">৳{m.sharedBills.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">৳{m.totalCost.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-purple-400">৳{m.marketPaid.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">৳{m.depositsPaid.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right text-slate-400">৳{m.previousBalance.toLocaleString()}</td>

                    {/* Final Balance */}
                    <td className="py-3.5 px-4 text-right text-sm font-black">
                      {m.finalBalance > 0 ? (
                        <span className="text-rose-400">+৳{m.finalBalance.toLocaleString()}</span>
                      ) : m.finalBalance < 0 ? (
                        <span className="text-emerald-400">-৳{Math.abs(m.finalBalance).toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-500">৳0</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-4 text-center font-sans">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'TO_PAY'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : m.status === 'TO_RECEIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {m.status === 'TO_PAY' ? 'To Pay' : m.status === 'TO_RECEIVE' ? 'To Receive' : 'Settled'}
                      </span>
                    </td>

                    {/* Statement Voucher action */}
                    <td className="py-3.5 px-4 text-center font-sans">
                      <button
                        onClick={() => handleViewStatement(m)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-brand-900/40 text-slate-300 hover:text-brand-300 border border-slate-700 text-[11px] font-semibold transition flex items-center gap-1 mx-auto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finalize Month Closing Modal */}
      {isCloseModalOpen && settlement && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Finalize & Lock Month ({selectedMonth})</h3>
                <p className="text-xs text-slate-400">Review accounts and carry forward outstanding balances</p>
              </div>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Total Mess Meals:</span>
                  <span className="font-bold text-white">{settlement.totalMessMeals}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Calculated Mill Rate:</span>
                  <span className="font-bold text-brand-400">৳{settlement.calculatedMillRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Market Expenses:</span>
                  <span className="font-bold text-purple-400">৳{settlement.totalMarketCost}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Shared Bills:</span>
                  <span className="font-bold text-sky-400">৳{settlement.totalSharedExpenses}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Final Mill Rate to Stamp (৳):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={overrideRate}
                  onChange={(e) => setOverrideRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Month Closing Notes / Audit Memo:
                </label>
                <textarea
                  rows={3}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="e.g. Accounts verified and finalized with all members present on 30th."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Locking this month will save a permanent financial snapshot and update each member's carried-forward balance.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCloseMonth}
                  disabled={closingMonth}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-md shadow-rose-600/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{closingMonth ? 'Closing Month...' : 'Confirm & Lock Month'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Printable Financial Voucher / Slip Modal */}
      {statementModalMember && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between no-print">
              <h3 className="text-base font-bold text-white">Individual Member Financial Voucher</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setStatementModalMember(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs bg-slate-950 text-slate-200" id="printable-voucher">
              {/* Mess Header */}
              <div className="text-center pb-4 border-b border-slate-800">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {memberStatementDetails?.settings?.messName || 'Green View Smart Mess'}
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {memberStatementDetails?.settings?.address || 'Sector 10, Uttara, Dhaka'}
                </p>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-800 text-brand-300 font-bold text-xs uppercase tracking-wider">
                  Member Financial Statement - {selectedMonth}
                </div>
              </div>

              {/* Member Details */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-slate-400">Member Name:</span>{' '}
                  <strong className="text-white text-sm">{statementModalMember.memberName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Billing Period:</span>{' '}
                  <strong className="text-white font-mono">{selectedMonth}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Final Mill Rate:</span>{' '}
                  <strong className="text-brand-400 font-mono">৳{statementModalMember.mealRate}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Total Consumed Meals:</span>{' '}
                  <strong className="text-amber-400 font-mono">{statementModalMember.totalMeals}</strong>
                </div>
              </div>

              {/* Calculation Summary Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-right">Debit / Cost (৳)</th>
                      <th className="py-2.5 px-3 text-right">Credit / Paid (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-2.5 px-3 font-sans">
                        Meal Cost ({statementModalMember.totalMeals} meals × ৳{statementModalMember.mealRate})
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200">৳{statementModalMember.mealCost}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans">
                        Allocated Shared Bills (Rent, Utilities, Internet, Cook)
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200">৳{statementModalMember.sharedBills}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                    </tr>
                    {statementModalMember.previousBalance !== 0 && (
                      <tr>
                        <td className="py-2.5 px-3 font-sans">Carried Forward Previous Due/Balance</td>
                        <td className="py-2.5 px-3 text-right text-slate-200">
                          ৳{statementModalMember.previousBalance}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2.5 px-3 font-sans text-purple-300">
                        Market Expenses Paid Personally (Bazar Credit)
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                      <td className="py-2.5 px-3 text-right text-purple-400 font-bold">
                        ৳{statementModalMember.marketPaid}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans text-emerald-300">
                        Monthly Deposits Paid (Cash, Online)
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        ৳{statementModalMember.depositsPaid}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-900 border-t-2 border-slate-800 font-bold font-mono">
                    <tr>
                      <td className="py-3 px-3 font-sans uppercase">Subtotals</td>
                      <td className="py-3 px-3 text-right text-white">
                        ৳{statementModalMember.totalCost + (statementModalMember.previousBalance || 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400">
                        ৳{statementModalMember.totalCredit}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Net Settlement Result */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between font-mono ${
                  statementModalMember.finalBalance > 0
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : statementModalMember.finalBalance < 0
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-sans font-bold text-sm">
                    {statementModalMember.finalBalance > 0
                      ? 'Net Due to Pay to Mess:'
                      : statementModalMember.finalBalance < 0
                      ? 'Net Refund to Receive from Mess:'
                      : 'Account Fully Settled:'}
                  </div>
                  <div className="font-sans text-[11px] text-slate-400">
                    Calculated on {format(new Date(), 'dd-MM-yyyy HH:mm')}
                  </div>
                </div>
                <div className="text-2xl font-black">
                  ৳{Math.abs(statementModalMember.finalBalance).toLocaleString()}
                </div>
              </div>

              {/* Signature lines */}
              <div className="pt-10 grid grid-cols-2 gap-12 text-center text-[11px] text-slate-400">
                <div>
                  <div className="border-t border-slate-700 w-40 mx-auto mb-1" />
                  <span>Member Signature</span>
                </div>
                <div>
                  <div className="border-t border-slate-700 w-40 mx-auto mb-1" />
                  <span>Mess Manager Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

