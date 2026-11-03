import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Member } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  X,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<any | null>(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<Member | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    roomNumber: '',
    emergencyContact: '',
    joiningDate: format(new Date(), 'yyyy-MM-dd'),
    initialBalance: 0,
    notes: '',
    status: 'ACTIVE'
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.getMembers(params);
      if (res.success) {
        setMembers(res.members);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      roomNumber: '',
      emergencyContact: '',
      joiningDate: format(new Date(), 'yyyy-MM-dd'),
      initialBalance: 0,
      notes: '',
      status: 'ACTIVE'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (mem: Member) => {
    setEditingMember(mem);
    setFormData({
      name: mem.name,
      phone: mem.phone,
      email: mem.email || '',
      address: mem.address || '',
      roomNumber: mem.roomNumber || '',
      emergencyContact: mem.emergencyContact || '',
      joiningDate: mem.joiningDate ? mem.joiningDate.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
      initialBalance: mem.currentBalance || 0,
      notes: mem.notes || '',
      status: mem.status
    });
    setIsAddModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingMember) {
        await api.updateMember(editingMember._id, formData);
      } else {
        await api.createMember(formData);
      }
      setIsAddModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to save member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate or remove member "${name}"?`)) return;
    try {
      await api.deleteMember(id);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete member.');
    }
  };

  const handleViewProfile = async (id: string) => {
    try {
      const res = await api.getMemberById(id);
      if (res.success) {
        setViewingMember(res);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load member profile.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Member Management</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Directory of mess members, contact details, rooms, and running balances
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, member code (MEM-001), phone, or room..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Search
          </button>
        </form>

        {/* Status Filter buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Member Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Code</th>
                <th className="py-3.5 px-4 font-bold">Member Name</th>
                <th className="py-3.5 px-4 font-bold">Phone Number</th>
                <th className="py-3.5 px-4 font-bold">Room</th>
                <th className="py-3.5 px-4 font-bold">Joining Date</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Current Balance</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No members found matching your search.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-400">{m.memberCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{m.name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{m.phone}</td>
                    <td className="py-3 px-4 text-slate-300">Room {m.roomNumber || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {m.joiningDate ? format(new Date(m.joiningDate), 'dd-MM-yyyy') : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {m.currentBalance > 0 ? (
                        <span className="text-rose-400">৳{m.currentBalance.toLocaleString()} Due</span>
                      ) : m.currentBalance < 0 ? (
                        <span className="text-emerald-400">৳{Math.abs(m.currentBalance).toLocaleString()} Adv</span>
                      ) : (
                        <span className="text-slate-500">৳0 Settled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewProfile(m._id)}
                          title="View Profile & Ledger"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-900/40 text-slate-300 hover:text-brand-400 border border-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(m)}
                          title="Edit Member"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmMember(m)}
                          title="Deactivate or Permanently Delete"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingMember ? `Edit Member: ${editingMember.name}` : 'Add New Mess Member'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +8801740721194"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. tanvir@mess.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Room Number</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. 101 or Bed 2"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Home Address / Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Sector 10, Uttara, Dhaka"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Initial Balance Carry (৳)</label>
                <input
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: Number(e.target.value) })}
                  placeholder="0 (Positive = Due, Negative = Advance)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold shadow-md shadow-brand-600/30"
                >
                  {actionLoading ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Profile Drawer Modal */}
      {viewingMember && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-widest">
                  {viewingMember.member.memberCode}
                </span>
                <h2 className="text-lg font-bold text-white">{viewingMember.member.name} Profile</h2>
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Stats overview */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Total Meals</div>
                  <div className="text-base font-bold text-amber-400 mt-1">{viewingMember.stats.totalMeals}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Deposits Paid</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">৳{viewingMember.stats.totalDeposits}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Bazar Paid</div>
                  <div className="text-base font-bold text-purple-400 mt-1">৳{viewingMember.stats.totalMarketPaid}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Balance</div>
                  <div className="text-base font-bold text-rose-400 mt-1">৳{viewingMember.stats.runningBalance}</div>
                </div>
              </div>

              {/* Personal info */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">Phone:</span> <span className="font-semibold text-white">{viewingMember.member.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span> <span className="font-semibold text-white">{viewingMember.member.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Room:</span> <span className="font-semibold text-white">Room {viewingMember.member.roomNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Address:</span> <span className="font-semibold text-white">{viewingMember.member.address || 'Uttara, Dhaka'}</span>
                </div>
              </div>

              {/* Recent meals */}
              <div>
                <h4 className="font-bold text-slate-200 mb-2">Recent Daily Meals</h4>
                <div className="space-y-1.5">
                  {viewingMember.recentActivity.meals.map((m: any) => (
                    <div key={m._id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex justify-between">
                      <span className="text-slate-400">{m.date}</span>
                      <span className="font-bold text-brand-400">{m.totalMeals} Meals (B:{m.breakfast} L:{m.lunch} D:{m.dinner})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Member Dialog */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111a2e] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Remove Member
                </h3>
                <p className="text-xs text-slate-400">
                  {deleteConfirmMember.name} ({deleteConfirmMember.memberCode})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Please choose how you want to remove this member:
            </p>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    await api.deleteMember(deleteConfirmMember._id, true);
                    setDeleteConfirmMember(null);
                    fetchMembers();
                  } catch (err: any) {
                    alert(err.message || 'Failed to delete member.');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-between shadow-lg shadow-rose-600/20"
              >
                <span>Permanently Delete Member</span>
                <span className="text-[10px] opacity-80">Removes from database</span>
              </button>

              <button
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    await api.deleteMember(deleteConfirmMember._id, false);
                    setDeleteConfirmMember(null);
                    fetchMembers();
                  } catch (err: any) {
                    alert(err.message || 'Failed to deactivate member.');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-between"
              >
                <span>Deactivate (Status: INACTIVE)</span>
                <span className="text-[10px] text-slate-400">Keeps financial history</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirmMember(null)}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

