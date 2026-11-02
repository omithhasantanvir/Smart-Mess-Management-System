/**
 * Centralized Financial Calculation Service
 *
 * Implements the financial logic based on standard mess management standards
 * and automated calculations referenced from MEAL.xlsx:
 *
 * 1. Mill Rate = Total Eligible Meal Expenses / Total Mess Meals
 * 2. Individual Meal Cost = Member Total Meals * Mill Rate
 * 3. Shared Bills Allocation = House Rent + Gas + Electricity + Wi-Fi + Cook/Khala + Security + Water + Other
 *    (allocated equally, by active membership days, or custom allocation)
 * 4. Member Financial Credits = Member Deposits + Personally Paid Bazar / Market Purchases
 * 5. Final Balance = (Meal Cost + Shared Bills + Extra Cost + Previous Due) - Financial Credits
 *    - Balance > 0 => TO_PAY (Member owes mess money)
 *    - Balance < 0 => TO_RECEIVE (Mess owes member money / member has surplus)
 *    - Balance == 0 => SETTLED
 */

export interface MemberMealSummary {
  memberId: string;
  memberName: string;
  totalMeals: number;
  breakfastCount?: number;
  lunchCount?: number;
  dinnerCount?: number;
  guestCount?: number;
}

export interface ExpenseAllocationInput {
  expenseId?: string;
  category: string;
  title: string;
  amount: number;
  sharingMethod: 'EQUAL' | 'ACTIVE_DAYS' | 'CUSTOM';
  includeInMealRate?: boolean;
  allocations?: {
    memberId: string;
    amount?: number;
    activeDays?: number;
    percentage?: number;
  }[];
}

export interface ActiveMemberInfo {
  memberId: string;
  memberName: string;
  activeDaysInMonth: number;
  daysInMonth: number;
  status: 'ACTIVE' | 'INACTIVE';
  previousBalance?: number; // positive = owed, negative = advance/credit
}

export interface SettlementInput {
  month: string; // YYYY-MM
  activeMembers: ActiveMemberInfo[];
  memberMeals: MemberMealSummary[];
  marketPurchases: {
    memberId: string;
    amount: number;
    category?: string;
  }[];
  deposits: {
    memberId: string;
    amount: number;
  }[];
  sharedExpenses: ExpenseAllocationInput[];
  individualExtras?: {
    memberId: string;
    amount: number;
    description?: string;
  }[];
  overrideMillRate?: number;
}

export interface MemberSettlementResult {
  memberId: string;
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
  memberSettlements: MemberSettlementResult[];
}

/**
 * Calculates the exact Mill Rate
 */
export function calculateMillRate(
  totalEligibleExpenses: number,
  totalMeals: number
): number {
  if (totalMeals <= 0 || isNaN(totalMeals)) {
    return 0;
  }
  const rate = totalEligibleExpenses / totalMeals;
  // Round to 4 decimal places for precision during calculations, display rounded to 2
  return Math.round(rate * 10000) / 10000;
}

/**
 * Calculates Shared Expense allocations across members
 */
export function allocateSharedExpense(
  expense: ExpenseAllocationInput,
  activeMembers: ActiveMemberInfo[],
  daysInMonth: number = 30
): Map<string, number> {
  const allocationMap = new Map<string, number>();

  if (!expense || expense.amount <= 0 || activeMembers.length === 0) {
    activeMembers.forEach(m => allocationMap.set(m.memberId, 0));
    return allocationMap;
  }

  if (expense.sharingMethod === 'CUSTOM' && expense.allocations && expense.allocations.length > 0) {
    for (const alloc of expense.allocations) {
      allocationMap.set(alloc.memberId, Math.round((alloc.amount || 0) * 100) / 100);
    }
    // fill in zeroes for members not in custom allocations
    for (const m of activeMembers) {
      if (!allocationMap.has(m.memberId)) {
        allocationMap.set(m.memberId, 0);
      }
    }
    return allocationMap;
  }

  if (expense.sharingMethod === 'ACTIVE_DAYS') {
    const totalActiveDays = activeMembers.reduce((sum, m) => sum + (m.activeDaysInMonth || daysInMonth), 0);
    if (totalActiveDays <= 0) {
      const equalShare = Math.round((expense.amount / activeMembers.length) * 100) / 100;
      activeMembers.forEach(m => allocationMap.set(m.memberId, equalShare));
      return allocationMap;
    }

    let allocatedSum = 0;
    activeMembers.forEach((m, idx) => {
      const days = m.activeDaysInMonth || daysInMonth;
      if (idx === activeMembers.length - 1) {
        // Adjust any rounding penny on the last member
        const remainder = Math.round((expense.amount - allocatedSum) * 100) / 100;
        allocationMap.set(m.memberId, remainder);
      } else {
        const share = Math.round(((expense.amount * days) / totalActiveDays) * 100) / 100;
        allocatedSum += share;
        allocationMap.set(m.memberId, share);
      }
    });
    return allocationMap;
  }

  // Default: EQUAL sharing among all active members
  const memberCount = activeMembers.length;
  const baseShare = Math.floor((expense.amount / memberCount) * 100) / 100;
  let remainder = Math.round((expense.amount - (baseShare * memberCount)) * 100) / 100;

  activeMembers.forEach((m, idx) => {
    let memberShare = baseShare;
    if (remainder > 0.001) {
      memberShare += 0.01;
      remainder = Math.round((remainder - 0.01) * 100) / 100;
    }
    allocationMap.set(m.memberId, Math.round(memberShare * 100) / 100);
  });

  return allocationMap;
}

/**
 * Calculates Full Monthly Mess Settlement
 */
export function calculateMonthlySettlement(
  input: SettlementInput
): MonthlySettlementSummary {
  const {
    month,
    activeMembers,
    memberMeals,
    marketPurchases,
    deposits,
    sharedExpenses,
    individualExtras = [],
    overrideMillRate
  } = input;

  // 1. Total mess meals
  const mealMap = new Map<string, number>();
  let totalMessMeals = 0;
  for (const m of memberMeals) {
    const count = m.totalMeals || 0;
    mealMap.set(m.memberId, count);
    totalMessMeals += count;
  }

  // 2. Market expenses & personally paid market credits
  const marketPaidMap = new Map<string, number>();
  let totalMarketCost = 0;
  for (const p of marketPurchases) {
    const amt = p.amount || 0;
    totalMarketCost += amt;
    const curr = marketPaidMap.get(p.memberId) || 0;
    marketPaidMap.set(p.memberId, curr + amt);
  }

  // 3. Eligible meal expenses (Bazar + any expense marked includeInMealRate)
  let additionalMealExpenses = 0;
  let totalCookBill = 0;
  let totalHouseExpenses = 0;

  for (const exp of sharedExpenses) {
    if (exp.category === 'COOK_BUA') {
      totalCookBill += exp.amount || 0;
    } else {
      totalHouseExpenses += exp.amount || 0;
    }

    if (exp.includeInMealRate) {
      additionalMealExpenses += exp.amount || 0;
    }
  }

  const eligibleMealExpenses = totalMarketCost + additionalMealExpenses;

  // 4. Mill Rate calculation
  const calculatedMillRate = calculateMillRate(eligibleMealExpenses, totalMessMeals);
  const appliedMillRate = (overrideMillRate !== undefined && overrideMillRate !== null && overrideMillRate > 0)
    ? overrideMillRate
    : calculatedMillRate;

  // 5. Deposits paid map
  const depositPaidMap = new Map<string, number>();
  let totalDeposits = 0;
  for (const d of deposits) {
    const amt = d.amount || 0;
    totalDeposits += amt;
    const curr = depositPaidMap.get(d.memberId) || 0;
    depositPaidMap.set(d.memberId, curr + amt);
  }

  // 6. Individual extras map
  const extraMap = new Map<string, number>();
  for (const ex of individualExtras) {
    const curr = extraMap.get(ex.memberId) || 0;
    extraMap.set(ex.memberId, curr + (ex.amount || 0));
  }

  // 7. Calculate shared bills allocation for each shared expense (excluding those in meal rate)
  const memberSharedBills = new Map<string, number>();
  const memberSharedBreakdown = new Map<string, { [cat: string]: number }>();

  for (const m of activeMembers) {
    memberSharedBills.set(m.memberId, 0);
    memberSharedBreakdown.set(m.memberId, {});
  }

  for (const exp of sharedExpenses) {
    // If it's already counted in meal rate, don't charge it twice as a separate shared bill!
    if (exp.includeInMealRate) {
      continue;
    }

    const allocations = allocateSharedExpense(exp, activeMembers);
    for (const [memId, share] of allocations.entries()) {
      const prevTotal = memberSharedBills.get(memId) || 0;
      memberSharedBills.set(memId, Math.round((prevTotal + share) * 100) / 100);

      const brk = memberSharedBreakdown.get(memId) || {};
      brk[exp.category] = Math.round(((brk[exp.category] || 0) + share) * 100) / 100;
      memberSharedBreakdown.set(memId, brk);
    }
  }

  // 8. Individual member settlements
  const memberSettlements: MemberSettlementResult[] = [];
  let totalMemberCosts = 0;
  let totalCredits = 0;

  for (const m of activeMembers) {
    const meals = mealMap.get(m.memberId) || 0;
    const mealCost = Math.round(meals * appliedMillRate * 100) / 100;
    const sharedBills = memberSharedBills.get(m.memberId) || 0;
    const sharedBillsBreakdown = memberSharedBreakdown.get(m.memberId) || {};
    const individualExtra = Math.round((extraMap.get(m.memberId) || 0) * 100) / 100;

    const totalCost = Math.round((mealCost + sharedBills + individualExtra) * 100) / 100;

    const marketPaid = Math.round((marketPaidMap.get(m.memberId) || 0) * 100) / 100;
    const depositsPaid = Math.round((depositPaidMap.get(m.memberId) || 0) * 100) / 100;
    const totalCredit = Math.round((marketPaid + depositsPaid) * 100) / 100;

    const previousBalance = Math.round((m.previousBalance || 0) * 100) / 100;

    // Final Balance Formula:
    // Balance = (Total Cost + Previous Due) - Total Financial Credit
    // Positive => Member owes money (TO_PAY)
    // Negative => Member has overpaid / will receive money (TO_RECEIVE)
    // Zero => Member is completely settled (SETTLED)
    const rawBalance = (totalCost + previousBalance) - totalCredit;
    const finalBalance = Math.round(rawBalance * 100) / 100;

    let status: 'TO_PAY' | 'TO_RECEIVE' | 'SETTLED' = 'SETTLED';
    if (finalBalance > 0.05) {
      status = 'TO_PAY';
    } else if (finalBalance < -0.05) {
      status = 'TO_RECEIVE';
    } else {
      status = 'SETTLED';
    }

    totalMemberCosts += totalCost;
    totalCredits += totalCredit;

    memberSettlements.push({
      memberId: m.memberId,
      memberName: m.memberName,
      totalMeals: meals,
      mealRate: appliedMillRate,
      mealCost,
      sharedBills,
      sharedBillsBreakdown,
      individualExtra,
      totalCost,
      marketPaid,
      depositsPaid,
      totalCredit,
      previousBalance,
      finalBalance,
      status
    });
  }

  const netMessBalance = Math.round((totalCredits - (totalMarketCost + totalHouseExpenses + totalCookBill)) * 100) / 100;

  return {
    month,
    totalMembers: activeMembers.length,
    totalMessMeals,
    totalMarketCost: Math.round(totalMarketCost * 100) / 100,
    eligibleMealExpenses: Math.round(eligibleMealExpenses * 100) / 100,
    calculatedMillRate,
    appliedMillRate,
    totalSharedExpenses: Math.round(totalHouseExpenses * 100) / 100,
    totalCookBill: Math.round(totalCookBill * 100) / 100,
    totalDeposits: Math.round(totalDeposits * 100) / 100,
    totalMemberCosts: Math.round(totalMemberCosts * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    netMessBalance,
    memberSettlements
  };
}

