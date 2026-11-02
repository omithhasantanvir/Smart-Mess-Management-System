import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Deposit, Member } from '../types';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Receipt,
  X,
  Search,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export const DepositsPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCollected, setTotalCollected] = useState(0);

  // Filters
  const [filterMember, setFilterMember] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formMember, setFormMember] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formAmount, setFormAmount] = useState<number>(3000);
  const [formMethod, setFormMethod] = useState('CASH');
  const [formTrxId, setFormTrxId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formReceipt, setFormReceipt] = useState<File | null>(null);

  const fetchMembers = async () => {
    try {
      const memRes = await api.getMembers({ status: 'ACTIVE' });
      if (memRes.success && memRes.members) {
        setMembers(memRes.members);
        if (memRes.members.length > 0) {
          setFormMember(prev => prev || memRes.members[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const depRes = await api.getDeposits({
        month: selectedMonth,
        member: filterMember || undefined,
        paymentMethod: filterMethod || undefined
      });

      if (depRes.success) {
        setDeposits(depRes.deposits);
        setTotalCollected(depRes.totalAmount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [selectedMonth, filterMember, filterMethod]);

  const handleOpenModal = () => {
    if (members.length === 0) fetchMembers();
    if (!formMember && members.length > 0) setFormMember(members[0]._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMember || formAmount <= 0) {
      alert('Please select a member and enter a valid positive amount.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('member', formMember);
      formData.append('date', formDate);
      formData.append('amount', String(formAmount));
      formData.append('paymentMethod', formMethod);
      formData.append('transactionId', formTrxId);
      formData.append('notes', formNotes);
      if (formReceipt) {
        formData.append('receipt', formReceipt);
      }

      await api.createDeposit(formData);
      setIsModalOpen(false);
      setFormNotes('');
      setFormTrxId('');
      setFormReceipt(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deposit record?')) return;
    try {
      await api.deleteDeposit(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete deposit.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Deposit & Payment Management</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track member monthly money deposits, online transfers, cash vouchers, and advances
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Deposit</span>
        </button>
      </div>

      {/* KPI & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-300 font-medium uppercase tracking-wider">
              Total Deposits in {selectedMonth}
            </div>
            <div className="text-2xl font-black text-white mt-1">৳{totalCollected.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Member filter */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
          <label className="text-[11px] font-semibold text-slate-400 mb-1">Filter By Member:</label>
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Members</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.memberCode})
              </option>
            ))}
          </select>
        </div>

        {/* Payment method filter */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
          <label className="text-[11px] font-semibold text-slate-400 mb-1">Filter By Payment Channel:</label>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Methods</option>
            <option value="CASH">CASH</option>
            <option value="BKASH">BKASH</option>
            <option value="NAGAD">NAGAD</option>
            <option value="BANK">BANK</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Payment Date</th>
                <th className="py-3.5 px-4 font-bold">Member Name</th>
                <th className="py-3.5 px-4 font-bold">Payment Method</th>
                <th className="py-3.5 px-4 font-bold">Transaction ID</th>
                <th className="py-3.5 px-4 font-bold">Notes</th>
                <th className="py-3.5 px-4 font-bold text-right">Amount (৳)</th>
                <th className="py-3.5 px-4 font-bold text-center">Receipt</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                    Loading deposits...
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No deposits recorded for this month.
                  </td>
                </tr>
              ) : (
                deposits.map((d) => {
                  const memName = typeof d.member === 'object' ? d.member?.name : 'Member';
                  const memCode = typeof d.member === 'object' ? d.member?.memberCode : 'MEM';

                  return (
                    <tr key={d._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-300 font-semibold">{d.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{memName}</div>
                        <div className="text-[10px] font-mono text-brand-400">{memCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {d.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {d.transactionId || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {d.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        +৳{d.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {d.receiptImage ? (
                          <a
                            href={d.receiptImage}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex p-1 rounded bg-slate-800 text-brand-400 hover:bg-slate-700"
                            title="View Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(d._id)}
                          title="Delete Deposit"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Deposit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Record Member Deposit</h3>
                <p className="text-xs text-slate-400">Add payment to member mess credit balance</p>
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
                <label className="block text-slate-400 font-semibold mb-1">Member *</label>
                <select
                  required
                  value={formMember}
                  onChange={(e) => setFormMember(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Member</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.memberCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500 text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BKASH">BKASH</option>
                    <option value="NAGAD">NAGAD</option>
                    <option value="BANK">BANK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Trx ID (if online)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9JA8KL4"
                    value={formTrxId}
                    onChange={(e) => setFormTrxId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Receipt / Screenshot</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormReceipt(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-950 file:text-emerald-300 hover:file:bg-emerald-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Month advance payment"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : `Deposit ৳${formAmount.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

