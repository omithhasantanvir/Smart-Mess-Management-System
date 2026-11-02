import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MarketTransaction, Member, MarketItem } from '../types';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Calendar,
  User,
  Tag,
  CreditCard,
  FileText,
  Upload,
  X,
  Search,
  CheckCircle2,
  Receipt,
  Eye,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export const DailyBazarPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const [transactions, setTransactions] = useState<MarketTransaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  // Filters
  const [filterMember, setFilterMember] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTxForView, setSelectedTxForView] = useState<MarketTransaction | null>(null);

  // Form state for multi-item bazar entry
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formBuyer, setFormBuyer] = useState('');
  const [formCategory, setFormCategory] = useState('GROCERY');
  const [formPaymentMethod, setFormPaymentMethod] = useState('CASH');
  const [formNotes, setFormNotes] = useState('');
  const [formReceipt, setFormReceipt] = useState<File | null>(null);

  const [items, setItems] = useState<MarketItem[]>([
    { name: '', quantity: 1, unit: 'kg', unitPrice: 0, totalPrice: 0, category: 'GROCERY' }
  ]);

  const fetchMembers = async () => {
    try {
      const memRes = await api.getMembers({ status: 'ACTIVE' });
      if (memRes.success && memRes.members) {
        setMembers(memRes.members);
        if (memRes.members.length > 0) {
          setFormBuyer(prev => prev || memRes.members[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const txRes = await api.getMarketTransactions({
        month: selectedMonth,
        purchasedBy: filterMember || undefined,
        category: filterCategory || undefined
      });

      if (txRes.success) {
        setTransactions(txRes.transactions);
        setTotalSpent(txRes.totalAmount);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [selectedMonth, filterMember, filterCategory]);

  const handleOpenModal = () => {
    if (members.length === 0) {
      fetchMembers();
    }
    if (!formBuyer && members.length > 0) {
      setFormBuyer(members[0]._id);
    }
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems(prev => [
      ...prev,
      { name: '', quantity: 1, unit: 'kg', unitPrice: 0, totalPrice: 0, category: formCategory }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof MarketItem, val: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(copy[idx].quantity) || 0;
        const price = Number(copy[idx].unitPrice) || 0;
        copy[idx].totalPrice = Math.round(qty * price * 100) / 100;
      }
      return copy;
    });
  };

  const formGrandTotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBuyer) {
      alert('Please select who purchased this bazar.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('date', formDate);
      formData.append('purchasedBy', formBuyer);
      formData.append('category', formCategory);
      formData.append('paymentMethod', formPaymentMethod);
      formData.append('notes', formNotes);
      formData.append('items', JSON.stringify(items));
      formData.append('totalAmount', String(formGrandTotal));
      if (formReceipt) {
        formData.append('receipt', formReceipt);
      }

      await api.createMarketTransaction(formData);
      setIsModalOpen(false);
      // Reset
      setItems([{ name: '', quantity: 1, unit: 'kg', unitPrice: 0, totalPrice: 0, category: 'GROCERY' }]);
      setFormNotes('');
      setFormReceipt(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record bazar transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this market transaction?')) return;
    try {
      await api.deleteMarketTransaction(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Daily Bazar / Market Management</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Log mess grocery shopping, itemized receipts, and member contributions
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Bazar</span>
        </button>
      </div>

      {/* Summary KPI & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs text-purple-300 font-medium uppercase tracking-wider">
              Total Bazar in {selectedMonth}
            </div>
            <div className="text-2xl font-black text-white mt-1">৳{totalSpent.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Filter by buyer */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
          <label className="text-[11px] font-semibold text-slate-400 mb-1">Filter By Shopper:</label>
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

        {/* Filter by Category */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
          <label className="text-[11px] font-semibold text-slate-400 mb-1">Filter By Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Categories</option>
            <option value="GROCERY">Grocery & Dry Goods</option>
            <option value="FISH_MEAT">Fish & Meat</option>
            <option value="VEGETABLES">Vegetables</option>
            <option value="SPICES">Spices & Oil</option>
            <option value="GAS_CYLINDER">Gas Cylinder</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Date</th>
                <th className="py-3.5 px-4 font-bold">Purchased By (Shopper)</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold">Itemized Details</th>
                <th className="py-3.5 px-4 font-bold">Payment Method</th>
                <th className="py-3.5 px-4 font-bold text-right">Total Amount</th>
                <th className="py-3.5 px-4 font-bold text-center">Receipt</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                    Loading market records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No bazar purchases found for this period.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const buyerName = typeof t.purchasedBy === 'object' ? t.purchasedBy?.name : 'Member';
                  const buyerCode = typeof t.purchasedBy === 'object' ? t.purchasedBy?.memberCode : 'MEM';

                  return (
                    <tr key={t._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-300 font-semibold">{t.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{buyerName}</div>
                        <div className="text-[10px] font-mono text-brand-400">{buyerCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300 max-w-xs truncate">
                          {t.items && t.items.length > 0 ? (
                            <span>
                              {t.items.map(it => `${it.name} (${it.quantity}${it.unit})`).join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">{t.notes || 'No description'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-400">{t.paymentMethod}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-400 text-sm">
                        ৳{t.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {t.receiptImage ? (
                          <a
                            href={t.receiptImage}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex p-1 rounded bg-slate-800 hover:bg-slate-700 text-brand-400"
                            title="View Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedTxForView(t)}
                            title="View Full Breakdown"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-brand-400 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t._id)}
                            title="Delete Transaction"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Bazar Modal (Multi-Item) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Record Daily Bazar Shopping</h2>
                <p className="text-xs text-slate-400">Add multiple purchased grocery items in one transaction</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Purchased By (Shopper) *</label>
                  <select
                    required
                    value={formBuyer}
                    onChange={(e) => setFormBuyer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 font-semibold"
                  >
                    {members.length === 0 ? (
                      <option value="">No active members found</option>
                    ) : (
                      <>
                        <option value="">Select Member</option>
                        {members.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.memberCode})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="GROCERY">Grocery</option>
                    <option value="FISH_MEAT">Fish & Meat</option>
                    <option value="VEGETABLES">Vegetables</option>
                    <option value="SPICES">Spices & Oil</option>
                    <option value="GAS_CYLINDER">Gas Cylinder</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Items Array */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200">Purchased Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Item name (e.g. Chicken)"
                          value={it.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs text-center font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={it.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                        >
                          <option value="kg">kg</option>
                          <option value="gm">gm</option>
                          <option value="liter">liter</option>
                          <option value="piece">piece</option>
                          <option value="packet">packet</option>
                          <option value="bundle">bundle</option>
                          <option value="cylinder">cylinder</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="1"
                          required
                          placeholder="Price/unit"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs text-right font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-right font-mono font-bold text-purple-400">
                        ৳{it.totalPrice}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total display & Payment method */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Calculated Total Bazar Cost:</span>
                </div>
                <div className="text-lg font-black text-purple-400 font-mono">
                  ৳{formGrandTotal.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BKASH">BKASH</option>
                    <option value="NAGAD">NAGAD</option>
                    <option value="BANK">BANK</option>
                    <option value="MESS_FUND">MESS FUND (DIRECT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Receipt / Bill Attachment</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFormReceipt(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-950 file:text-purple-300 hover:file:bg-purple-900 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Bought from Kawran Bazar / Uttara local market"
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
                  disabled={submitting || formGrandTotal <= 0}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md shadow-purple-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : `Record Bazar (৳${formGrandTotal})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTxForView && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                  {selectedTxForView.date}
                </span>
                <h3 className="text-base font-bold text-white">Itemized Bazar Voucher</h3>
              </div>
              <button
                onClick={() => setSelectedTxForView(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                <div>
                  <div className="text-slate-400">Shopper / Paid By:</div>
                  <div className="font-bold text-white text-sm">
                    {typeof selectedTxForView.purchasedBy === 'object'
                      ? selectedTxForView.purchasedBy?.name
                      : 'Member'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Total Voucher Amount:</div>
                  <div className="font-mono font-bold text-purple-400 text-base">
                    ৳{selectedTxForView.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 mb-2">Item Breakdown:</h4>
                <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  {selectedTxForView.items.map((it, i) => (
                    <div key={i} className="p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-200">{it.name}</span>
                        <span className="text-slate-500 ml-2 font-mono">
                          {it.quantity} {it.unit} @ ৳{it.unitPrice}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-100">৳{it.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTxForView.receiptImage && (
                <div>
                  <h4 className="font-bold text-slate-300 mb-2">Attached Receipt:</h4>
                  <img
                    src={selectedTxForView.receiptImage}
                    alt="Receipt"
                    className="max-h-60 rounded-xl border border-slate-800 mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

