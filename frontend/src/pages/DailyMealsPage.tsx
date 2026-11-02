import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MealItem } from '../types';
import {
  UtensilsCrossed,
  Calendar,
  Save,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

export const DailyMealsPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const [viewMode, setViewMode] = useState<'DAILY' | 'MONTHLY_MATRIX'>('DAILY');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Monthly Matrix data
  const [monthlyData, setMonthlyData] = useState<any | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Load daily meals for selected date
  const fetchDailyMeals = async () => {
    try {
      setLoading(true);
      setSuccessMsg(null);
      const res = await api.getDailyMeals(selectedDate);
      if (res.success) {
        setRows(res.members);
        setIsLocked(res.isLocked);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load monthly matrix
  const fetchMonthlyMatrix = async () => {
    try {
      setMatrixLoading(true);
      const res = await api.getMonthlyMeals(selectedDate.slice(0, 7));
      if (res.success) {
        setMonthlyData(res);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setMatrixLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'DAILY') {
      fetchDailyMeals();
    } else {
      fetchMonthlyMatrix();
    }
  }, [selectedDate, viewMode]);

  const handleInputChange = (memberId: string, field: 'breakfast' | 'lunch' | 'dinner' | 'guestMeal', val: number) => {
    if (isLocked) return;
    setRows(prev =>
      prev.map(r => {
        if (r.memberId === memberId) {
          const updated = { ...r, [field]: val };
          updated.totalMeals =
            (Number(updated.breakfast) || 0) +
            (Number(updated.lunch) || 0) +
            (Number(updated.dinner) || 0) +
            (Number(updated.guestMeal) || 0);
          return updated;
        }
        return r;
      })
    );
  };

  const handleSaveBulk = async () => {
    try {
      setSaving(true);
      setSuccessMsg(null);
      const entries = rows.map(r => ({
        memberId: r.memberId,
        breakfast: r.breakfast,
        lunch: r.lunch,
        dinner: r.dinner,
        guestMeal: r.guestMeal,
        notes: r.notes
      }));

      const res = await api.bulkSaveDailyMeals(selectedDate, entries);
      if (res.success) {
        setSuccessMsg(`Meals for ${selectedDate} saved successfully.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save meals.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetStandardAll = (b: number, l: number, d: number) => {
    if (isLocked) return;
    setRows(prev =>
      prev.map(r => ({
        ...r,
        breakfast: b,
        lunch: l,
        dinner: d,
        totalMeals: b + l + d + (r.guestMeal || 0)
      }))
    );
  };

  const totalDailyMessMeals = rows.reduce((sum, r) => sum + (r.totalMeals || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Daily Meal Management</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Multi-member daily meal entries, automatic meal calculations, and monthly matrix
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('DAILY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'DAILY' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Entry Sheet
          </button>
          <button
            onClick={() => setViewMode('MONTHLY_MATRIX')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'MONTHLY_MATRIX' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Monthly Grid (MEAL.xlsx)</span>
          </button>
        </div>
      </div>

      {isLocked && (
        <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>This month is LOCKED and finalized. Meal entries cannot be edited unless reopened by an Admin.</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {viewMode === 'DAILY' ? (
        <>
          {/* Date Selector & Quick Controls */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs sm:text-sm font-semibold">
                <Calendar className="w-4 h-4 text-brand-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-[11px] text-slate-500 font-medium">Quick Fill:</span>
              <button
                type="button"
                onClick={() => handleSetStandardAll(1, 1, 1)}
                disabled={isLocked}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-50"
              >
                Full Day (1-1-1)
              </button>
              <button
                type="button"
                onClick={() => handleSetStandardAll(0, 1, 1)}
                disabled={isLocked}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-50"
              >
                Lunch+Dinner (0-1-1)
              </button>
              <button
                type="button"
                onClick={() => handleSetStandardAll(0, 0, 0)}
                disabled={isLocked}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-50"
              >
                Off All (0-0-0)
              </button>

              <button
                type="button"
                onClick={handleSaveBulk}
                disabled={saving || isLocked}
                className="ml-2 flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save All Meals'}</span>
              </button>
            </div>
          </div>

          {/* Daily Multi-member Entry Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Code</th>
                    <th className="py-3.5 px-4 font-bold">Member Name</th>
                    <th className="py-3.5 px-4 font-bold text-center w-28">Breakfast (0.5/1)</th>
                    <th className="py-3.5 px-4 font-bold text-center w-28">Lunch (1)</th>
                    <th className="py-3.5 px-4 font-bold text-center w-28">Dinner (1)</th>
                    <th className="py-3.5 px-4 font-bold text-center w-28">Guest/Extra</th>
                    <th className="py-3.5 px-4 font-bold text-center w-28">Total Meals</th>
                    <th className="py-3.5 px-4 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                        Loading daily meal records...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No active members found. Add members first.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.memberId} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-brand-400">{r.memberCode}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-100">{r.memberName}</td>

                        {/* Breakfast input */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="5"
                            disabled={isLocked}
                            value={r.breakfast}
                            onChange={(e) => handleInputChange(r.memberId, 'breakfast', parseFloat(e.target.value) || 0)}
                            className="w-16 py-1 px-2 text-center bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                          />
                        </td>

                        {/* Lunch input */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            disabled={isLocked}
                            value={r.lunch}
                            onChange={(e) => handleInputChange(r.memberId, 'lunch', parseFloat(e.target.value) || 0)}
                            className="w-16 py-1 px-2 text-center bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                          />
                        </td>

                        {/* Dinner input */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            disabled={isLocked}
                            value={r.dinner}
                            onChange={(e) => handleInputChange(r.memberId, 'dinner', parseFloat(e.target.value) || 0)}
                            className="w-16 py-1 px-2 text-center bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                          />
                        </td>

                        {/* Guest input */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="20"
                            disabled={isLocked}
                            value={r.guestMeal}
                            onChange={(e) => handleInputChange(r.memberId, 'guestMeal', parseInt(e.target.value) || 0)}
                            className="w-16 py-1 px-2 text-center bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                          />
                        </td>

                        {/* Row total meals */}
                        <td className="py-2 px-4 text-center">
                          <span className="font-mono font-bold text-sm text-brand-400 bg-brand-950/60 border border-brand-800/40 px-2.5 py-1 rounded-lg inline-block min-w-10">
                            {r.totalMeals}
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            placeholder="Guest name or note..."
                            disabled={isLocked}
                            value={r.notes || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRows(prev => prev.map(item => item.memberId === r.memberId ? { ...item, notes: val } : item));
                            }}
                            className="w-full py-1 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-brand-500"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Footer Total */}
                <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-800 text-slate-300">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 uppercase text-xs tracking-wider">
                      Mess Daily Total
                    </td>
                    <td colSpan={4} className="text-right py-3 px-4 text-xs text-slate-400">
                      Total Mess Meals on {selectedDate}:
                    </td>
                    <td className="text-center py-3 px-4 font-mono text-base text-brand-400">
                      {totalDailyMessMeals}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Monthly Grid Matrix (mirrors MEAL.xlsx Sheet1) */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Full Monthly Meal Grid Matrix</h3>
              <p className="text-xs text-slate-400">
                Automated equivalent of Excel MEAL.xlsx Sheet1 for {selectedDate.slice(0, 7)}
              </p>
            </div>
            <button
              onClick={fetchMonthlyMatrix}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {matrixLoading || !monthlyData ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
              Loading month matrix...
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[650px]">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10">
                  <tr className="border-b border-slate-800 text-[10px] uppercase">
                    <th className="py-2.5 px-3 text-left font-bold border-r border-slate-800 sticky left-0 bg-slate-950 z-20 min-w-36">
                      Member Name
                    </th>
                    {Array.from({ length: monthlyData.daysInMonth }, (_, i) => i + 1).map((d) => (
                      <th key={d} className="py-2 px-1.5 border-r border-slate-800 font-mono min-w-7">
                        {d}
                      </th>
                    ))}
                    <th className="py-2 px-3 font-bold text-brand-400 bg-slate-900 min-w-16">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {monthlyData.members.map((m: any) => (
                    <tr key={m.memberId} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-left font-semibold text-slate-200 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 font-sans">
                        {m.memberName}
                      </td>
                      {Array.from({ length: monthlyData.daysInMonth }, (_, i) => i + 1).map((d) => {
                        const count = m.days[d] || 0;
                        return (
                          <td
                            key={d}
                            className={`py-1.5 px-1 border-r border-slate-800/80 text-[11px] ${
                              count > 0 ? 'text-slate-200 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {count > 0 ? count : '-'}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 font-bold text-brand-400 bg-slate-950/60">
                        {m.totalMeals}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-800 text-slate-300 sticky bottom-0 z-10">
                  <tr>
                    <td className="py-2.5 px-3 text-left uppercase text-[10px] border-r border-slate-800 sticky left-0 bg-slate-950 z-20 font-sans">
                      Daily Mess Total
                    </td>
                    {Array.from({ length: monthlyData.daysInMonth }, (_, i) => i + 1).map((d) => (
                      <td key={d} className="py-2 px-1 border-r border-slate-800 text-[11px] text-amber-400">
                        {monthlyData.dailyTotals[d] || 0}
                      </td>
                    ))}
                    <td className="py-2 px-3 font-bold text-sm text-brand-400 bg-brand-950/60">
                      {monthlyData.grandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

