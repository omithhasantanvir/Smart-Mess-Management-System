import React, { useState } from 'react';
import { Sidebar, NavItemKey } from './Sidebar';
import { Navbar } from './Navbar';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  currentMonth: string;
  onMonthChange: (m: string) => void;
  messName?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  currentMonth,
  onMonthChange,
  messName
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isOpenMobile={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentMonth={currentMonth}
          onMonthChange={onMonthChange}
          onToggleSidebar={() => setMobileOpen(true)}
          messName={messName}
        />

        {/* Mobile menu trigger bar */}
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <Menu className="w-4 h-4 text-brand-500" />
            <span>Open Navigation</span>
          </button>
          <span className="text-xs font-medium text-brand-600 dark:text-brand-400 capitalize">{activeTab}</span>
        </div>

        {/* Dynamic page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

