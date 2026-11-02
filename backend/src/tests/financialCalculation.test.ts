import {
  calculateMillRate,
  allocateSharedExpense,
  calculateMonthlySettlement,
  ActiveMemberInfo,
  ExpenseAllocationInput
} from '../services/financialCalculation';

describe('Financial Calculation Service', () => {
  describe('Mill Rate Calculation', () => {
    test('calculates correct mill rate for typical mess figures', () => {
      // e.g. ৳30,000 expense across 1000 meals = ৳30/meal
      const rate = calculateMillRate(30000, 1000);
      expect(rate).toBe(30);
    });

    test('handles decimal meal rate with precision', () => {
      // ৳25,500 / 685 meals
      const rate = calculateMillRate(25500, 685);
      expect(rate).toBeCloseTo(37.2263, 3);
    });

    test('returns 0 when total meals is 0 or negative', () => {
      expect(calculateMillRate(10000, 0)).toBe(0);
      expect(calculateMillRate(10000, -5)).toBe(0);
    });

    test('returns 0 when total expenses is 0', () => {
      expect(calculateMillRate(0, 500)).toBe(0);
    });
  });

  describe('Shared Expense Allocation', () => {
    const members: ActiveMemberInfo[] = [
      { memberId: 'm1', memberName: 'Tanvir', activeDaysInMonth: 30, daysInMonth: 30, status: 'ACTIVE' },
      { memberId: 'm2', memberName: 'Muntahi', activeDaysInMonth: 30, daysInMonth: 30, status: 'ACTIVE' },
      { memberId: 'm3', memberName: 'Real', activeDaysInMonth: 30, daysInMonth: 30, status: 'ACTIVE' }
    ];

    test('splits expense equally with cent precision', () => {
      const expense: ExpenseAllocationInput = {
        title: 'House Rent',
        category: 'HOUSE_RENT',
        amount: 15000,
        sharingMethod: 'EQUAL'
      };

      const allocations = allocateSharedExpense(expense, members);
      expect(allocations.get('m1')).toBe(5000);
      expect(allocations.get('m2')).toBe(5000);
      expect(allocations.get('m3')).toBe(5000);
    });

    test('splits expense proportionally by active membership days', () => {
      const variedMembers: ActiveMemberInfo[] = [
        { memberId: 'm1', memberName: 'Tanvir', activeDaysInMonth: 30, daysInMonth: 30, status: 'ACTIVE' },
        { memberId: 'm2', memberName: 'Muntahi', activeDaysInMonth: 15, daysInMonth: 30, status: 'ACTIVE' },
        { memberId: 'm3', memberName: 'Real', activeDaysInMonth: 15, daysInMonth: 30, status: 'ACTIVE' }
      ];

      const expense: ExpenseAllocationInput = {
        title: 'Electricity Bill',
        category: 'ELECTRICITY',
        amount: 6000,
        sharingMethod: 'ACTIVE_DAYS'
      };

      // Total days = 30 + 15 + 15 = 60. m1 = 50%, m2 = 25%, m3 = 25%
      const allocations = allocateSharedExpense(expense, variedMembers);
      expect(allocations.get('m1')).toBe(3000);
      expect(allocations.get('m2')).toBe(1500);
      expect(allocations.get('m3')).toBe(1500);
    });

    test('respects custom allocation overrides', () => {
      const expense: ExpenseAllocationInput = {
        title: 'Special Repair',
        category: 'OTHER',
        amount: 1000,
        sharingMethod: 'CUSTOM',
        allocations: [
          { memberId: 'm1', amount: 600 },
          { memberId: 'm2', amount: 400 }
        ]
      };

      const allocations = allocateSharedExpense(expense, members);
      expect(allocations.get('m1')).toBe(600);
      expect(allocations.get('m2')).toBe(400);
      expect(allocations.get('m3')).toBe(0);
    });
  });

  describe('Complete Monthly Settlement Engine', () => {
    test('correctly calculates settlement without double counting market credits', () => {
      const activeMembers: ActiveMemberInfo[] = [
        { memberId: 'm1', memberName: 'Tanvir', activeDaysInMonth: 30, daysInMonth: 30, status: 'ACTIVE', previousBalance: 0 },
        { memberId: 'm2', memberName: 'Real', activeDaysInMonth: 30, daysInMonth: 30, status: 'ACTIVE', previousBalance: 200 }
      ];

      const memberMeals = [
        { memberId: 'm1', memberName: 'Tanvir', totalMeals: 60 },
        { memberId: 'm2', memberName: 'Real', totalMeals: 40 }
      ];

      // Tanvir did ৳5,000 market purchase
      const marketPurchases = [
        { memberId: 'm1', amount: 5000 }
      ];

      // Real deposited ৳4,000 cash; Tanvir deposited ৳1,000
      const deposits = [
        { memberId: 'm1', amount: 1000 },
        { memberId: 'm2', amount: 4000 }
      ];

      // House rent ৳6,000 (shared equally = ৳3,000 each)
      const sharedExpenses: ExpenseAllocationInput[] = [
        {
          title: 'House Rent',
          category: 'HOUSE_RENT',
          amount: 6000,
          sharingMethod: 'EQUAL'
        }
      ];

      // Total meals = 60 + 40 = 100.
      // Total market = 5000.
      // Meal rate = 5000 / 100 = 50.
      // Tanvir meal cost = 60 * 50 = 3000. Shared rent = 3000. Total cost = 6000.
      // Tanvir credits = 5000 (market) + 1000 (deposit) = 6000.
      // Tanvir balance = 6000 - 6000 = 0 -> SETTLED!
      //
      // Real meal cost = 40 * 50 = 2000. Shared rent = 3000. Prev due = 200. Total = 5200.
      // Real credits = 4000.
      // Real balance = 5200 - 4000 = 1200 -> TO_PAY!

      const result = calculateMonthlySettlement({
        month: '2026-10',
        activeMembers,
        memberMeals,
        marketPurchases,
        deposits,
        sharedExpenses
      });

      expect(result.calculatedMillRate).toBe(50);
      expect(result.totalMessMeals).toBe(100);

      const tanvir = result.memberSettlements.find(m => m.memberId === 'm1')!;
      expect(tanvir.mealCost).toBe(3000);
      expect(tanvir.sharedBills).toBe(3000);
      expect(tanvir.totalCost).toBe(6000);
      expect(tanvir.marketPaid).toBe(5000);
      expect(tanvir.depositsPaid).toBe(1000);
      expect(tanvir.totalCredit).toBe(6000);
      expect(tanvir.finalBalance).toBe(0);
      expect(tanvir.status).toBe('SETTLED');

      const real = result.memberSettlements.find(m => m.memberId === 'm2')!;
      expect(real.mealCost).toBe(2000);
      expect(real.sharedBills).toBe(3000);
      expect(real.previousBalance).toBe(200);
      expect(real.totalCost).toBe(5000);
      expect(real.totalCredit).toBe(4000);
      expect(real.finalBalance).toBe(1200);
      expect(real.status).toBe('TO_PAY');
    });

    test('correctly handles member who should receive refund (TO_RECEIVE)', () => {
      const activeMembers: ActiveMemberInfo[] = [
        { memberId: 'm1', memberName: 'Tanvir', activeDaysInMonth: 30, daysInMonth: 30, status: 'ACTIVE', previousBalance: 0 }
      ];

      const result = calculateMonthlySettlement({
        month: '2026-10',
        activeMembers,
        memberMeals: [{ memberId: 'm1', memberName: 'Tanvir', totalMeals: 20 }],
        marketPurchases: [{ memberId: 'm1', amount: 1000 }], // 1000 / 20 = 50 rate -> meal cost = 1000
        deposits: [{ memberId: 'm1', amount: 2000 }], // deposited extra 2000
        sharedExpenses: []
      });

      const tanvir = result.memberSettlements[0];
      // Total cost = 1000, Total Credit = 1000 (market) + 2000 (deposit) = 3000.
      // Balance = 1000 - 3000 = -2000.
      expect(tanvir.finalBalance).toBe(-2000);
      expect(tanvir.status).toBe('TO_RECEIVE');
    });
  });
});

