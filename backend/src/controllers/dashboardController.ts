import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Member } from '../models/Member';
import { Meal } from '../models/Meal';
import { MarketTransaction } from '../models/MarketTransaction';
import { Deposit } from '../models/Deposit';
import { Expense } from '../models/Expense';
import { AuditLog } from '../models/AuditLog';
import { calculateMillRate } from '../services/financialCalculation';
import { format, subMonths } from 'date-fns';

export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const currentMonth = todayStr.slice(0, 7);

    // 1. Members
    const totalActiveMembers = await Member.countDocuments({ status: 'ACTIVE' });
    const members = await Member.find().sort({ memberCode: 1 });

    // 2. Today's meals
    const todaysMealsDocs = await Meal.find({ date: todayStr });
    const todaysTotalMeals = todaysMealsDocs.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

    // 3. This month's meals
    const currentMonthMealsDocs = await Meal.find({ month: currentMonth });
    const totalMealsThisMonth = currentMonthMealsDocs.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

    // 4. This month's market expenses
    const marketDocs = await MarketTransaction.find({ month: currentMonth });
    const totalMarketExpenses = marketDocs.reduce((sum, m) => sum + (m.totalAmount || 0), 0);

    // 5. This month's deposits
    const depositDocs = await Deposit.find({ month: currentMonth });
    const currentMonthTotalDeposits = depositDocs.reduce((sum, d) => sum + (d.amount || 0), 0);

    // 6. House expenses & cook bill
    const expenseDocs = await Expense.find({ month: currentMonth });
    const totalHouseExpenses = expenseDocs.reduce((sum, e) => sum + (e.amount || 0), 0);

    // 7. Mill rate calculation
    const currentMillRate = calculateMillRate(totalMarketExpenses, totalMealsThisMonth);

    // 8. Total outstanding dues
    const membersWithDues = members
      .filter(m => (m.currentBalance || 0) > 0)
      .map(m => ({
        memberId: m._id,
        memberCode: m.memberCode,
        name: m.name,
        phone: m.phone,
        dueAmount: m.currentBalance
      }));

    const totalOutstandingBalance = membersWithDues.reduce((sum, m) => sum + m.dueAmount, 0);

    // 9. Member-wise meal comparison (Top 10 members this month)
    const memberMealMap: { [id: string]: { name: string; meals: number } } = {};
    currentMonthMealsDocs.forEach(m => {
      const id = m.member.toString();
      if (!memberMealMap[id]) {
        const memObj = members.find(x => x._id.toString() === id);
        memberMealMap[id] = { name: memObj?.name || 'Member', meals: 0 };
      }
      memberMealMap[id].meals += m.totalMeals || 0;
    });
    const memberMealComparison = Object.values(memberMealMap);

    // 10. Daily meal consumption trend this month
    const dailyMealMap: { [day: string]: number } = {};
    currentMonthMealsDocs.forEach(m => {
      dailyMealMap[m.date] = (dailyMealMap[m.date] || 0) + (m.totalMeals || 0);
    });
    const dailyMealConsumption = Object.keys(dailyMealMap)
      .sort()
      .map(date => ({
        date: date.slice(8), // DD
        fullDate: date,
        meals: dailyMealMap[date]
      }));

    // 11. Last 6 months financial trend overview
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = subMonths(new Date(), i);
      const mStr = format(mDate, 'yyyy-MM');
      const mLabel = format(mDate, 'MMM yyyy');

      const mMarket = await MarketTransaction.find({ month: mStr });
      const marketSum = mMarket.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      const mDeposit = await Deposit.find({ month: mStr });
      const depositSum = mDeposit.reduce((sum, d) => sum + (d.amount || 0), 0);

      const mExpense = await Expense.find({ month: mStr });
      const expenseSum = mExpense.reduce((sum, e) => sum + (e.amount || 0), 0);

      const mMeals = await Meal.find({ month: mStr });
      const mealsSum = mMeals.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

      last6Months.push({
        month: mStr,
        label: mLabel,
        market: marketSum,
        deposit: depositSum,
        houseExpense: expenseSum,
        totalExpense: marketSum + expenseSum,
        meals: mealsSum,
        millRate: calculateMillRate(marketSum, mealsSum)
      });
    }

    // 12. Recent lists
    const recentMarket = await MarketTransaction.find()
      .populate('purchasedBy', 'name memberCode')
      .sort({ date: -1, createdAt: -1 })
      .limit(6);

    const recentDeposits = await Deposit.find()
      .populate('member', 'name memberCode')
      .sort({ date: -1, createdAt: -1 })
      .limit(6);

    const recentActivities = await AuditLog.find().sort({ createdAt: -1 }).limit(8);

    res.json({
      success: true,
      currentMonth,
      todayStr,
      summaryCards: {
        totalActiveMembers,
        totalMealsThisMonth,
        todaysTotalMeals,
        totalMarketExpenses,
        currentMonthTotalDeposits,
        currentMillRate,
        totalHouseExpenses,
        totalOutstandingBalance
      },
      charts: {
        dailyMealConsumption,
        memberMealComparison,
        last6Months
      },
      recentMarket,
      recentDeposits,
      membersWithDues,
      recentActivities
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

