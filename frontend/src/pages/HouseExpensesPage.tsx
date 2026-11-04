import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Expense, Member } from '../types';
import {
  Home,
  Plus,
  Trash2,
  Calendar,
  Receipt,
  X,
  RefreshCw,
  Users,
  Eye,
  CheckCircle2,
  Zap,
  Wifi,
  Flame,
  Droplets,
  ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';

export const HouseExpensesPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('HOUSE_RENT');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formSharingMethod, setFormSharingMethod] = useState<'EQUAL' | 'ACTIVE_DAYS' | 'CUSTOM'>('EQUAL');
  const [formDescription, setFormDescription] = useState('');
  const [formReceipt, setFormReceipt] = useState<File | null>(null);
  const [formIncludeMealRate, setFormIncludeMealRate] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, memRes] = await Promise.all([
        api.getExpenses({ month: selectedMonth }),
        api.getMembers({ status: 'ACTIVE' })
      ]);

      if (expRes.success) {
        // Exclude COOK_BUA from this general house expense list, as it has its own dedicated page
        const general = expRes.expenses.filter((e: Expense) => e.category !== 'COOK_BUA');
        setExpenses(general);
        const sum = general.reduce((acc: number, e: Expense) => acc + (e.amount || 0), 0);
        setTotalExpenses(sum);
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
    if (!formTitle || formAmount <= 0) {
      alert('Please fill in title and a valid positive amount.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formTitle);
      formData.append('category', formCategory);
      formData.append('amount', String(formAmount));
      formData.append('date', formDate);
      formData.append('sharingMethod', formSharingMethod);
      formData.append('includeInMealRate', String(formIncludeMealRate));
      formData.append('description', formDescription);
      if (formReceipt) {
        formData.append('receipt', formReceipt);
      }

      await api.createExpense(formData);
      setIsModalOpen(false);
      setFormTitle('');
      setFormAmount(0);
      setFormDescription('');
      setFormReceipt(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shared expense?')) return;
    try {
      await api.deleteExpense(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'ELECTRICITY': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'WIFI': return <Wifi className="w-4 h-4 text-blue-400" />;
      case 'GAS': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'WATER': return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'SECURITY': return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      default: return <Home className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">House Rent & Monthly Bills</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Apartment rent, electricity, gas, water, Wi-Fi, security, and cleaner shared expenses
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Monthly Bill / Rent</span>
        </button>
      </div>

      {/* KPI banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total House Bills in {selectedMonth}
            </div>
            <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
              ৳{totalExpenses.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 shadow-sm">
            <Home className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Mess Members</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{members.length} Members</div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
            Shared equally ~ <br />
            <strong className="text-slate-800 dark:text-white font-mono">
              ৳{members.length > 0 ? Math.round(totalExpenses / members.length) : 0}
            </strong> / member
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Allocation Method</div>
            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-1">EQUAL / ACTIVE DAYS / CUSTOM</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold">Expense Title</th>
                <th className="py-3.5 px-4 font-bold">Date</th>
                <th className="py-3.5 px-4 font-bold">Sharing Method</th>
                <th className="py-3.5 px-4 font-bold text-right">Total Amount (৳)</th>
                <th className="py-3.5 px-4 font-bold text-center">Receipt</th>
                <th className="py-3.5 px-4 font-bold text-center">Allocations</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No shared house bills recorded for this month.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 flex items-center gap-2">
                      {getCategoryIcon(e.category)}
                      <span className="font-semibold text-slate-200">{e.category}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{e.title}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{e.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {e.sharingMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sky-400 text-sm">
                      ৳{e.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {e.receiptImage ? (
                        <a
                          href={e.receiptImage}
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
                        onClick={() => setViewingExpense(e)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700"
                      >
                        View Split ({e.allocations?.length || 0})
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(e._id)}
                        title="Delete Expense"
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Add Monthly Shared Expense</h3>
                <p className="text-xs text-slate-400">Configure bill amount and sharing formula</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Expense Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="HOUSE_RENT">House Rent</option>
                    <option value="ELECTRICITY">Electricity Bill</option>
                    <option value="GAS">Gas Bill</option>
                    <option value="WATER">Water Bill</option>
                    <option value="WIFI">Wi-Fi Bill</option>
                    <option value="SECURITY">Security / Guard Bill</option>
                    <option value="CLEANER">Cleaner Bill</option>
                    <option value="OTHER">Other Shared Bill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Bill Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. November Flat Rent"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Total Amount (৳) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Bill Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Sharing Method</label>
                <select
                  value={formSharingMethod}
                  onChange={(e: any) => setFormSharingMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  <option value="EQUAL">1. Equally among active members</option>
                  <option value="ACTIVE_DAYS">2. According to membership days</option>
                  <option value="CUSTOM">3. Custom member-wise allocation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bill Attachment / Voucher</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormReceipt(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-950 file:text-sky-300 hover:file:bg-sky-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Paid to Landlord via Bank Transfer"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold shadow-md shadow-sky-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : `Save Bill (৳${formAmount.toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation breakdown viewer modal */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{viewingExpense.title}</h3>
                <p className="text-xs text-sky-400 font-mono">Total: ৳{viewingExpense.amount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className="text-slate-400 mb-2">Member Allocation Breakdown:</div>
              <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {viewingExpense.allocations.map((a, i) => {
                  const mName = typeof a.member === 'object' ? a.member?.name : 'Member';
                  const mCode = typeof a.member === 'object' ? a.member?.memberCode : 'MEM';
                  return (
                    <div key={i} className="p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-200">{mName}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5 font-mono">({mCode})</span>
                      </div>
                      <span className="font-mono font-bold text-sky-400">৳{a.amount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

