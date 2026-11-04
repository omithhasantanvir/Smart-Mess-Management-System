import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Expense, Member } from '../types';
import {
  ChefHat,
  Plus,
  Trash2,
  Calendar,
  Receipt,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export const BuaCookBillPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const [buaBills, setBuaBills] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formAmount, setFormAmount] = useState<number>(6000);
  const [formDescription, setFormDescription] = useState('Monthly Bua / Cook Salary');
  const [formReceipt, setFormReceipt] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [res, memRes] = await Promise.all([
        api.getBuaBills(),
        api.getMembers({ status: 'ACTIVE' })
      ]);
      if (res.success) {
        setBuaBills(res.buaBills);
        setTotalPaid(res.totalPaid);
      }
      if (memRes.success) {
        setMembers(memRes.members);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', `Cook Salary - ${formDate.slice(0, 7)}`);
      formData.append('category', 'COOK_BUA');
      formData.append('amount', String(formAmount));
      formData.append('date', formDate);
      formData.append('sharingMethod', 'EQUAL');
      formData.append('includeInMealRate', 'false');
      formData.append('description', formDescription);
      if (formReceipt) {
        formData.append('receipt', formReceipt);
      }

      await api.createExpense(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save cook bill.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cook bill record?')) return;
    try {
      await api.deleteExpense(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Bua / Cook Monthly Salary</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Dedicated payment ledger and history for mess cook, khala salary, and assistance bills
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Cook Salary</span>
        </button>
      </div>

      {/* KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Cook Salaries Paid (Lifetime)
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              ৳{totalPaid.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shadow-sm">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Members Sharing</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{members.length} Members</div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
            Shared equally across members <br />
            under monthly settlement
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Month / Date</th>
                <th className="py-3.5 px-4 font-bold">Description</th>
                <th className="py-3.5 px-4 font-bold">Sharing Split</th>
                <th className="py-3.5 px-4 font-bold text-right">Amount Paid</th>
                <th className="py-3.5 px-4 font-bold text-center">Receipt / Voucher</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                    Loading cook salary records...
                  </td>
                </tr>
              ) : buaBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No cook salary records found.
                  </td>
                </tr>
              ) : (
                buaBills.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">{b.date}</td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{b.description || b.title}</td>
                    <td className="py-3 px-4 text-slate-400">
                      Shared equally ({b.allocations?.length || members.length} members)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                      ৳{b.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.receiptImage ? (
                        <a
                          href={b.receiptImage}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex p-1 rounded bg-slate-800 text-brand-400 hover:bg-slate-700"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Record Cook / Khala Salary</h3>
                <p className="text-xs text-slate-400">Monthly mess cook payment</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Salary Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500 text-right"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Receipt / Voucher Attachment</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormReceipt(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-950 file:text-amber-300 hover:file:bg-amber-900 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || formAmount <= 0}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold shadow-md shadow-amber-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : `Record Salary (৳${formAmount.toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

