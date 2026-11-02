import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  ShoppingCart,
  Percent,
  Wallet,
  Home,
  ChefHat,
  Calculator,
  BarChart3,
  UserCheck,
  Shield,
  Settings,
  X
} from 'lucide-react';

export type NavItemKey =
  | 'dashboard'
  | 'members'
  | 'meals'
  | 'bazar'
  | 'millrate'
  | 'deposits'
  | 'house'
  | 'buacook'
  | 'settlement'
  | 'reports'
  | 'portal'
  | 'users'
  | 'settings';

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { isAdmin, isManager, isMember } = useAuth();

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { key: 'members', label: 'Members', icon: Users, visible: isManager },
    { key: 'meals', label: 'Daily Meals', icon: UtensilsCrossed, visible: isManager },
    { key: 'bazar', label: 'Daily Bazar', icon: ShoppingCart, visible: true },
    { key: 'millrate', label: 'Mill Rate', icon: Percent, visible: true },
    { key: 'deposits', label: 'Deposits', icon: Wallet, visible: isManager },
    { key: 'house', label: 'House Expenses', icon: Home, visible: isManager },
    { key: 'buacook', label: 'Bua/Cook Bill', icon: ChefHat, visible: isManager },
    { key: 'settlement', label: 'Monthly Settlement', icon: Calculator, visible: isManager },
    { key: 'reports', label: 'Reports', icon: BarChart3, visible: isManager },
    { key: 'portal', label: 'Member Portal', icon: UserCheck, visible: true },
    { key: 'users', label: 'User Management', icon: Shield, visible: isAdmin },
    { key: 'settings', label: 'Settings', icon: Settings, visible: isManager },
  ];

  const handleSelect = (key: NavItemKey) => {
    onSelectTab(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm tracking-tight leading-none">Smart Mess</h1>
              <p className="text-[10px] text-brand-400 font-medium tracking-wide uppercase mt-0.5">Management System</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>
          {navItems
            .filter(item => item.visible)
            .map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleSelect(item.key as NavItemKey)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/50">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-300">Bangladeshi Mess</div>
              <div className="text-[10px] text-slate-400">Currency: ৳ (BDT)</div>
            </div>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
          </div>
        </div>
      </aside>
    </>
  );
};

