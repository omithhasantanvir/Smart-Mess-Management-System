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
  Sparkles,
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
      title: 'OVERVIEW',
      items: [
        { key: 'dashboard', label: 'Financial Dashboard', icon: LayoutDashboard, visible: true },
        { key: 'portal', label: 'Member Portal', icon: UserCheck, visible: true }
      ]
    },
    {
      title: 'DAILY OPERATIONS',
      items: [
        { key: 'meals', label: 'Daily Meals', icon: UtensilsCrossed, visible: isManager },
        { key: 'bazar', label: 'Daily Bazar & Shopping', icon: ShoppingCart, visible: true },
        { key: 'millrate', label: 'Mill Rate Analytics', icon: Percent, visible: true }
      ]
    },
    {
      title: 'FINANCE & BILLING',
      items: [
        { key: 'deposits', label: 'Member Deposits', icon: Wallet, visible: isManager },
        { key: 'house', label: 'House Shared Bills', icon: Home, visible: isManager },
        { key: 'buacook', label: 'Bua / Cook Salary', icon: ChefHat, visible: isManager },
        { key: 'settlement', label: 'Monthly Settlement', icon: Calculator, visible: isManager }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { key: 'members', label: 'Member Management', icon: Users, visible: isManager },
        { key: 'reports', label: 'Financial Reports', icon: BarChart3, visible: isManager },
        { key: 'users', label: 'User Roles & Access', icon: Shield, visible: isAdmin },
        { key: 'settings', label: 'Mess Configuration', icon: Settings, visible: isManager }
      ]
    }
  ];

  const handleSelect = (key: NavItemKey) => {
    onSelectTab(key);
    onCloseMobile();
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    MANAGER: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    MEMBER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#090d16] border-r border-slate-800/60 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-800/60 bg-gradient-to-r from-slate-900/60 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090d16] glow-dot text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-white text-base tracking-tight leading-none">
                  Smart Mess
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-1">
                Automated Hostel ERP
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400/90 tracking-widest uppercase flex items-center justify-between">
                  <span>{section.title}</span>
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelect(item.key as NavItemKey)}
                      className={`w-full group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-600/90 to-indigo-600/90 text-white shadow-lg shadow-brand-600/25 border border-brand-400/30 font-bold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-white/15 text-white'
                              : 'text-slate-400 group-hover:text-brand-400 group-hover:bg-brand-500/10'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="tracking-tight">{item.label}</span>
                      </div>
                      {isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom User Card */}
        <div className="p-3.5 border-t border-slate-800/60 bg-slate-950/60">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800/80 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.name || 'User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border tracking-wider uppercase ${
                      roleColors[user?.role || 'MEMBER']
                    }`}
                  >
                    {user?.role || 'MEMBER'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
