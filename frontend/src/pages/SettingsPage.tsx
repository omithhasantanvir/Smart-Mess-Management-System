import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MessSettings } from '../types';
import {
  Settings,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  DollarSign,
  Building
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<MessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">System & Mess Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure mess identity, Bangladeshi Taka currency, meal multipliers, and accounting rules
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Mess configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Mess Details Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-400" />
            Mess Identity & Manager Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mess / Hostel Name</label>
              <input
                type="text"
                required
                value={settings.messName}
                onChange={(e) => setSettings({ ...settings, messName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Manager Name</label>
              <input
                type="text"
                required
                value={settings.managerName}
                onChange={(e) => setSettings({ ...settings, managerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Manager Phone Number</label>
              <input
                type="text"
                value={settings.contactNumber}
                onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mess Full Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Currency Symbol</label>
            <input
              type="text"
              value={settings.currencySymbol || '৳'}
              onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
              className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-brand-400 font-bold text-center focus:outline-none"
            />
          </div>
        </div>

        {/* Meal Weight Multipliers */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Standard Meal Weight Multipliers
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Breakfast Multiplier</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.defaultMealConfig?.breakfastMultiplier ?? 0.5}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultMealConfig: {
                      ...settings.defaultMealConfig,
                      breakfastMultiplier: parseFloat(e.target.value) || 0
                    }
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-center focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Lunch Multiplier</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.defaultMealConfig?.lunchMultiplier ?? 1}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultMealConfig: {
                      ...settings.defaultMealConfig,
                      lunchMultiplier: parseFloat(e.target.value) || 0
                    }
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-center focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Dinner Multiplier</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.defaultMealConfig?.dinnerMultiplier ?? 1}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultMealConfig: {
                      ...settings.defaultMealConfig,
                      dinnerMultiplier: parseFloat(e.target.value) || 0
                    }
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-center focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

