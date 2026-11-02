import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/layout/Layout';
import { NavItemKey } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { DailyMealsPage } from './pages/DailyMealsPage';
import { DailyBazarPage } from './pages/DailyBazarPage';
import { MillRatePage } from './pages/MillRatePage';
import { DepositsPage } from './pages/DepositsPage';
import { HouseExpensesPage } from './pages/HouseExpensesPage';
import { BuaCookBillPage } from './pages/BuaCookBillPage';
import { MonthlySettlementPage } from './pages/MonthlySettlementPage';
import { ReportsPage } from './pages/ReportsPage';
import { MemberPortalPage } from './pages/MemberPortalPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading, isMember } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState<NavItemKey>('dashboard');

  // If member, switch to portal initially
  React.useEffect(() => {
    if (isMember) {
      setActiveTab('portal');
    }
  }, [isMember]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Initializing Smart Mess Management System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTab={(tab) => setActiveTab(tab as NavItemKey)} />;
      case 'members':
        return <MembersPage />;
      case 'meals':
        return <DailyMealsPage selectedMonth={currentMonth} />;
      case 'bazar':
        return <DailyBazarPage selectedMonth={currentMonth} />;
      case 'millrate':
        return <MillRatePage selectedMonth={currentMonth} />;
      case 'deposits':
        return <DepositsPage selectedMonth={currentMonth} />;
      case 'house':
        return <HouseExpensesPage selectedMonth={currentMonth} />;
      case 'buacook':
        return <BuaCookBillPage selectedMonth={currentMonth} />;
      case 'settlement':
        return <MonthlySettlementPage selectedMonth={currentMonth} />;
      case 'reports':
        return <ReportsPage selectedMonth={currentMonth} />;
      case 'portal':
        return <MemberPortalPage selectedMonth={currentMonth} />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigateTab={(tab) => setActiveTab(tab as NavItemKey)} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      currentMonth={currentMonth}
      onMonthChange={setCurrentMonth}
      messName="Green View Smart Mess"
    >
      {renderActivePage()}
    </Layout>
  );
};

