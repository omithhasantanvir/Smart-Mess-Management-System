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
  X,
  LogOut,
  ChevronRight
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
  const { user, logout, isAdmin, isManager } = useAuth();

  const navSections = [
    {
      title: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
        { key: 'portal', label: 'Member Portal', icon: UserCheck, visible: true }
      ]
    },
    {
      title: 'Daily Operations',
      items: [
        { key: 'meals', label: 'Daily Meals', icon: UtensilsCrossed, visible: isManager },
        { key: 'bazar', label: 'Daily Bazar', icon: ShoppingCart, visible: true },
        { key: 'millrate', label: 'Mill Rate', icon: Percent, visible: true }
      ]
    },
    {
      title: 'Finance & Bills',
      items: [
        { key: 'deposits', label: 'Member Deposits', icon: Wallet, visible: isManager },
        { key: 'house', label: 'House Bills', icon: Home, visible: isManager },
        { key: 'buacook', label: 'Bua / Cook Bill', icon: ChefHat, visible: isManager },
        { key: 'settlement', label: 'Monthly Settlement', icon: Calculator, visible: isManager }
      ]
    },
    {
      title: 'Administration',
      items: [
        { key: 'members', label: 'Member Directory', icon: Users, visible: isManager },
        { key: 'reports', label: 'Reports & Export', icon: BarChart3, visible: isManager },
        { key: 'users', label: 'User Roles', icon: Shield, visible: isAdmin },
        { key: 'settings', label: 'Settings', icon: Settings, visible: isManager }
      ]
    }
  ];

  const handleSelect = (key: NavItemKey) => {
    onSelectTab(key);
    onCloseMobile();
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
    MANAGER: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
    MEMBER: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
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
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-[#0d1527] border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-all duration-200 ease-in-out shadow-xl ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0f192e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight leading-none">
                  Smart Mess
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
                  SYSTEM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-normal mt-0.5">
                Mess Management
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.title}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelect(item.key as NavItemKey)}
                      className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 dark:bg-brand-600 dark:text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom User Card & Dedicated Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0a101f] space-y-2">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider ${
                    roleColors[user?.role || 'MEMBER']
                  }`}
                >
                  {user?.role || 'MEMBER'}
                </span>
              </div>
            </div>
          </div>

          {/* Full-width, Prominent Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition shadow-sm"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Sign Out / Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
