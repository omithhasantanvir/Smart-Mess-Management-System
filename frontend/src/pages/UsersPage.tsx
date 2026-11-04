import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Key,
  CheckCircle,
  XCircle,
  RefreshCw,
  UserCheck,
  AlertCircle,
  X
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Password reset modal
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (currentUser && currentUser._id === userId && currentActive) {
      alert('You cannot deactivate your own logged-in account.');
      return;
    }
    if (!confirm(`Are you sure you want to ${currentActive ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }
    try {
      await api.updateUserRole(userId, undefined as any, !currentActive);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;
    setActionLoading(true);
    try {
      await api.resetPassword(resetModalUser._id, newPassword);
      setResetModalUser(null);
      setNewPassword('');
      alert('Password reset successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">User Accounts &amp; Roles</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage authentication accounts, assign ADMIN, MANAGER, or MEMBER permissions
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">User Name</th>
                <th className="py-3.5 px-4 font-bold">Email Address</th>
                <th className="py-3.5 px-4 font-bold">Role Permission</th>
                <th className="py-3.5 px-4 font-bold">Linked Member ID</th>
                <th className="py-3.5 px-4 font-bold text-center">Active Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                    Loading user accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const linkedName = typeof u.memberId === 'object' ? (u.memberId as any)?.name : null;
                  const linkedCode = typeof u.memberId === 'object' ? (u.memberId as any)?.memberCode : null;

                  return (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">{u.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-brand-600 dark:text-brand-400 focus:outline-none"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="MEMBER">MEMBER</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        {linkedName ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {linkedName} ({linkedCode})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not linked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setResetModalUser(u)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1 mx-auto"
                        >
                          <Key className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          <span>Reset Password</span>
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

      {/* Password reset dialog */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Reset Password for {resetModalUser.name}</h3>
              <button onClick={() => setResetModalUser(null)}>
                <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                >
                  {actionLoading ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
