import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Member } from '../models/Member';
import { Meal } from '../models/Meal';
import { MarketTransaction } from '../models/MarketTransaction';
import { Deposit } from '../models/Deposit';
import { Expense } from '../models/Expense';
import { MonthlySettlement } from '../models/MonthlySettlement';
import { MessSettings } from '../models/MessSettings';
import { AuditLog } from '../models/AuditLog';
import {
  calculateMonthlySettlement,
  ActiveMemberInfo,
  MemberMealSummary,
  ExpenseAllocationInput
} from '../services/financialCalculation';

export const getMonthlySettlementData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) {
      res.status(400).json({ success: false, message: 'Month parameter (YYYY-MM) is required.' });
      return;
    }

    const monthStr = month as string;

    // Check if month has a locked settlement snapshot
    const existingSettlement = await MonthlySettlement.findOne({ month: monthStr });
    if (existingSettlement && existingSettlement.status === 'LOCKED') {
      res.json({
        success: true,
        isLocked: true,
        settlement: existingSettlement
      });
      return;
    }

    // Active members
    const activeMembers = await Member.find({ status: 'ACTIVE' }).sort({ memberCode: 1 });
    const memberInfos: ActiveMemberInfo[] = activeMembers.map(m => ({
      memberId: m._id.toString(),
      memberName: m.name,
      activeDaysInMonth: 30,
      daysInMonth: 30,
      status: m.status,
      previousBalance: m.currentBalance || 0
    }));

    // Member meals for this month
    const meals = await Meal.find({ month: monthStr });
    const mealMap = new Map<string, number>();
    meals.forEach(m => {
      const id = m.member.toString();
      mealMap.set(id, (mealMap.get(id) || 0) + (m.totalMeals || 0));
    });

    const memberMealSummaries: MemberMealSummary[] = activeMembers.map(m => ({
      memberId: m._id.toString(),
      memberName: m.name,
      totalMeals: mealMap.get(m._id.toString()) || 0
    }));

    // Market purchases this month
    const marketTx = await MarketTransaction.find({ month: monthStr });
    const marketPurchases = marketTx.map(t => ({
      memberId: t.purchasedBy.toString(),
      amount: t.totalAmount,
      category: t.category
    }));

    // Deposits this month
    const depositsList = await Deposit.find({ month: monthStr });
    const deposits = depositsList.map(d => ({
      memberId: d.member.toString(),
      amount: d.amount
    }));

    // House bills and shared expenses
    const expensesList = await Expense.find({ month: monthStr });
    const sharedExpenses: ExpenseAllocationInput[] = expensesList.map(e => ({
      expenseId: e._id.toString(),
      category: e.category,
      title: e.title,
      amount: e.amount,
      sharingMethod: e.sharingMethod,
      includeInMealRate: e.includeInMealRate,
      allocations: e.allocations.map(a => ({
        memberId: a.member.toString(),
        amount: a.amount,
        activeDays: a.activeDays
      }))
    }));

    // Run pure financial settlement calculation
    const calculated = calculateMonthlySettlement({
      month: monthStr,
      activeMembers: memberInfos,
      memberMeals: memberMealSummaries,
      marketPurchases,
      deposits,
      sharedExpenses
    });

    res.json({
      success: true,
      isLocked: false,
      settlement: calculated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const closeMonth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, notes, overrideMillRate } = req.body; // YYYY-MM

    if (!month) {
      res.status(400).json({ success: false, message: 'Month (YYYY-MM) is required.' });
      return;
    }

    const monthStr = month as string;

    const existing = await MonthlySettlement.findOne({ month: monthStr });
    if (existing && existing.status === 'LOCKED') {
      res.status(400).json({ success: false, message: `Month ${monthStr} is already locked and finalized.` });
      return;
    }

    // Active members
    const activeMembers = await Member.find({ status: 'ACTIVE' }).sort({ memberCode: 1 });
    const memberInfos: ActiveMemberInfo[] = activeMembers.map(m => ({
      memberId: m._id.toString(),
      memberName: m.name,
      activeDaysInMonth: 30,
      daysInMonth: 30,
      status: m.status,
      previousBalance: m.currentBalance || 0
    }));

    const meals = await Meal.find({ month: monthStr });
    const mealMap = new Map<string, number>();
    meals.forEach(m => {
      const id = m.member.toString();
      mealMap.set(id, (mealMap.get(id) || 0) + (m.totalMeals || 0));
    });

    const memberMealSummaries: MemberMealSummary[] = activeMembers.map(m => ({
      memberId: m._id.toString(),
      memberName: m.name,
      totalMeals: mealMap.get(m._id.toString()) || 0
    }));

    const marketTx = await MarketTransaction.find({ month: monthStr });
    const marketPurchases = marketTx.map(t => ({
      memberId: t.purchasedBy.toString(),
      amount: t.totalAmount,
      category: t.category
    }));

    const depositsList = await Deposit.find({ month: monthStr });
    const deposits = depositsList.map(d => ({
      memberId: d.member.toString(),
      amount: d.amount
    }));

    const expensesList = await Expense.find({ month: monthStr });
    const sharedExpenses: ExpenseAllocationInput[] = expensesList.map(e => ({
      expenseId: e._id.toString(),
      category: e.category,
      title: e.title,
      amount: e.amount,
      sharingMethod: e.sharingMethod,
      includeInMealRate: e.includeInMealRate,
      allocations: e.allocations.map(a => ({
        memberId: a.member.toString(),
        amount: a.amount,
        activeDays: a.activeDays
      }))
    }));

    const calculated = calculateMonthlySettlement({
      month: monthStr,
      activeMembers: memberInfos,
      memberMeals: memberMealSummaries,
      marketPurchases,
      deposits,
      sharedExpenses,
      overrideMillRate: Number(overrideMillRate) || undefined
    });

    // Save final settlement snapshot
    const settlementDoc = await MonthlySettlement.findOneAndUpdate(
      { month: monthStr },
      {
        month: monthStr,
        status: 'LOCKED',
        totalMembers: calculated.totalMembers,
        totalMessMeals: calculated.totalMessMeals,
        totalMarketCost: calculated.totalMarketCost,
        eligibleMealExpenses: calculated.eligibleMealExpenses,
        calculatedMillRate: calculated.calculatedMillRate,
        appliedMillRate: calculated.appliedMillRate,
        totalSharedExpenses: calculated.totalSharedExpenses,
        totalCookBill: calculated.totalCookBill,
        totalDeposits: calculated.totalDeposits,
        totalMemberCosts: calculated.totalMemberCosts,
        totalCredits: calculated.totalCredits,
        netMessBalance: calculated.netMessBalance,
        memberSettlements: calculated.memberSettlements.map(ms => ({
          member: ms.memberId,
          memberName: ms.memberName,
          totalMeals: ms.totalMeals,
          mealRate: ms.mealRate,
          mealCost: ms.mealCost,
          sharedBills: ms.sharedBills,
          sharedBillsBreakdown: ms.sharedBillsBreakdown,
          individualExtra: ms.individualExtra,
          totalCost: ms.totalCost,
          marketPaid: ms.marketPaid,
          depositsPaid: ms.depositsPaid,
          totalCredit: ms.totalCredit,
          previousBalance: ms.previousBalance,
          finalBalance: ms.finalBalance,
          status: ms.status
        })),
        closedBy: req.user?._id,
        closedAt: new Date(),
        notes: notes || ''
      },
      { upsert: true, new: true }
    );

    // Carry forward final balances to Member.currentBalance
    for (const ms of calculated.memberSettlements) {
      await Member.findByIdAndUpdate(ms.memberId, {
        currentBalance: ms.finalBalance
      });
    }

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'CLOSE_MONTH',
      module: 'SETTLEMENT',
      details: {
        month: monthStr,
        finalMillRate: calculated.appliedMillRate,
        totalMessMeals: calculated.totalMessMeals
      }
    });

    res.json({
      success: true,
      message: `Month ${monthStr} closed and locked successfully. Balances carried forward.`,
      settlement: settlementDoc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reopenMonth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.body;
    if (!month) {
      res.status(400).json({ success: false, message: 'Month (YYYY-MM) is required.' });
      return;
    }

    const monthStr = month as string;
    const settlement = await MonthlySettlement.findOne({ month: monthStr });
    if (!settlement) {
      res.status(404).json({ success: false, message: 'Settlement record not found.' });
      return;
    }

    settlement.status = 'OPEN';
    await settlement.save();

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'REOPEN_MONTH',
      module: 'SETTLEMENT',
      details: { month: monthStr }
    });

    res.json({
      success: true,
      message: `Month ${monthStr} successfully reopened for editing.`,
      settlement
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMemberStatement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, memberId } = req.query;
    if (!month || !memberId) {
      res.status(400).json({ success: false, message: 'Month and memberId are required.' });
      return;
    }

    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    const settings = (await MessSettings.findOne()) || {
      messName: 'Green View Smart Mess',
      currencySymbol: '৳',
      managerName: 'Tanvir',
      contactNumber: '+8801740721194'
    };

    // Itemized details for this member
    const meals = await Meal.find({ month: month as string, member: memberId }).sort({ date: 1 });
    const market = await MarketTransaction.find({ month: month as string, purchasedBy: memberId }).sort({ date: 1 });
    const deposits = await Deposit.find({ month: month as string, member: memberId }).sort({ date: 1 });

    res.json({
      success: true,
      settings,
      member,
      month,
      itemizedMeals: meals,
      itemizedMarket: market,
      itemizedDeposits: deposits
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

