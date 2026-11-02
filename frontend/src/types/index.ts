export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  memberId?: string | { _id: string; name: string; memberCode: string };
  avatar?: string;
  isActive: boolean;
}

export interface Member {
  _id: string;
  memberCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  roomNumber?: string;
  joiningDate: string;
  leavingDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  currentBalance: number;
  userId?: string;
  notes?: string;
}

export interface MealItem {
  memberId: string;
  memberCode: string;
  memberName: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeal: number;
  totalMeals: number;
  notes?: string;
  mealId?: string | null;
}

export interface MarketItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface MarketTransaction {
  _id: string;
  date: string;
  month: string;
  purchasedBy: { _id: string; name: string; memberCode: string } | string;
  items: MarketItem[];
  totalAmount: number;
  category: string;
  paymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'MESS_FUND';
  receiptImage?: string;
  notes?: string;
  createdAt: string;
}

export interface Deposit {
  _id: string;
  member: { _id: string; name: string; memberCode: string } | string;
  date: string;
  month: string;
  amount: number;
  paymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK';
  transactionId?: string;
  receiptImage?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseAllocation {
  member: { _id: string; name: string; memberCode: string } | string;
  amount: number;
  activeDays?: number;
  percentage?: number;
}

export interface Expense {
  _id: string;
  title: string;
  category:
    | 'HOUSE_RENT'
    | 'ELECTRICITY'
    | 'GAS'
    | 'WATER'
    | 'WIFI'
    | 'SECURITY'
    | 'CLEANER'
    | 'COOK_BUA'
    | 'OTHER';
  amount: number;
  date: string;
  month: string;
  paidBy?: { _id: string; name: string; memberCode: string } | null;
  sharingMethod: 'EQUAL' | 'ACTIVE_DAYS' | 'CUSTOM';
  allocations: ExpenseAllocation[];
  includeInMealRate: boolean;
  receiptImage?: string;
  description?: string;
  createdAt: string;
}

export interface MemberSettlement {
  member: string;
  memberName: string;
  totalMeals: number;
  mealRate: number;
  mealCost: number;
  sharedBills: number;
  sharedBillsBreakdown: { [category: string]: number };
  individualExtra: number;
  totalCost: number;
  marketPaid: number;
  depositsPaid: number;
  totalCredit: number;
  previousBalance: number;
  finalBalance: number;
  status: 'TO_PAY' | 'TO_RECEIVE' | 'SETTLED';
}

export interface MonthlySettlementSummary {
  month: string;
  status?: 'OPEN' | 'CLOSED' | 'LOCKED';
  totalMembers: number;
  totalMessMeals: number;
  totalMarketCost: number;
  eligibleMealExpenses: number;
  calculatedMillRate: number;
  appliedMillRate: number;
  totalSharedExpenses: number;
  totalCookBill: number;
  totalDeposits: number;
  totalMemberCosts: number;
  totalCredits: number;
  netMessBalance: number;
  memberSettlements: MemberSettlement[];
}

export interface MessSettings {
  messName: string;
  currencySymbol: string;
  address: string;
  managerName: string;
  contactNumber: string;
  defaultMealConfig: {
    breakfastMultiplier: number;
    lunchMultiplier: number;
    dinnerMultiplier: number;
  };
  eligibleMealExpenseCategories: string[];
  autoLockClosedMonths: boolean;
}

export interface DashboardOverview {
  currentMonth: string;
  todayStr: string;
  summaryCards: {
    totalActiveMembers: number;
    totalMealsThisMonth: number;
    todaysTotalMeals: number;
    totalMarketExpenses: number;
    currentMonthTotalDeposits: number;
    currentMillRate: number;
    totalHouseExpenses: number;
    totalOutstandingBalance: number;
  };
  charts: {
    dailyMealConsumption: { date: string; fullDate: string; meals: number }[];
    memberMealComparison: { name: string; meals: number }[];
    last6Months: {
      month: string;
      label: string;
      market: number;
      deposit: number;
      houseExpense: number;
      totalExpense: number;
      meals: number;
      millRate: number;
    }[];
  };
  recentMarket: MarketTransaction[];
  recentDeposits: Deposit[];
  membersWithDues: {
    memberId: string;
    memberCode: string;
    name: string;
    phone: string;
    dueAmount: number;
  }[];
  recentActivities: {
    _id: string;
    userName: string;
    action: string;
    module: string;
    details: any;
    createdAt: string;
  }[];
}

