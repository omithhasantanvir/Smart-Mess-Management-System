import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Expense } from '../models/Expense';
import { Member } from '../models/Member';
import { MonthlySettlement } from '../models/MonthlySettlement';
import { AuditLog } from '../models/AuditLog';
import { allocateSharedExpense, ActiveMemberInfo } from '../services/financialCalculation';

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, category } = req.query;
    const query: any = {};

    if (month && month !== 'undefined') query.month = month;
    if (category && category !== 'undefined' && category !== 'null' && category !== '') query.category = category;

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name memberCode')
      .populate('allocations.member', 'name memberCode')
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.json({
      success: true,
      count: expenses.length,
      totalAmount,
      expenses
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      category,
      amount,
      date,
      paidBy,
      sharingMethod,
      allocations,
      includeInMealRate,
      description
    } = req.body;

    if (!title || !category || !amount || !date) {
      res.status(400).json({ success: false, message: 'Title, category, amount, and date are required.' });
      return;
    }

    const month = date.slice(0, 7);
    const settlement = await MonthlySettlement.findOne({ month });
    if (settlement?.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: `Month ${month} is LOCKED. Modifications are not allowed.`
      });
      return;
    }

    let receiptImage = '';
    if (req.file) {
      receiptImage = `/uploads/${req.file.filename}`;
    }

    // Auto-compute allocations if not provided and sharingMethod is EQUAL or ACTIVE_DAYS
    let finalAllocations = [];
    if (allocations && (typeof allocations === 'string' || Array.isArray(allocations))) {
      finalAllocations = typeof allocations === 'string' ? JSON.parse(allocations) : allocations;
    } else {
      const activeMembers = await Member.find({ status: 'ACTIVE' });
      const memberInfos: ActiveMemberInfo[] = activeMembers.map(m => ({
        memberId: m._id.toString(),
        memberName: m.name,
        activeDaysInMonth: 30,
        daysInMonth: 30,
        status: m.status
      }));

      const computed = allocateSharedExpense(
        {
          title,
          category,
          amount: Number(amount),
          sharingMethod: sharingMethod || 'EQUAL'
        },
        memberInfos
      );

      finalAllocations = activeMembers.map(m => ({
        member: m._id,
        amount: computed.get(m._id.toString()) || 0,
        activeDays: 30
      }));
    }

    const expense = await Expense.create({
      title,
      category,
      amount: Number(amount),
      date,
      month,
      paidBy: paidBy || null,
      sharingMethod: sharingMethod || 'EQUAL',
      allocations: finalAllocations,
      includeInMealRate: Boolean(includeInMealRate),
      receiptImage,
      description: description || '',
      createdBy: req.user?._id
    });

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'CREATE_EXPENSE',
      module: 'EXPENSES',
      details: { id: expense._id, category, amount, date }
    });

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name memberCode')
      .populate('allocations.member', 'name memberCode');

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully.',
      expense: populated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      amount,
      date,
      paidBy,
      sharingMethod,
      allocations,
      includeInMealRate,
      description
    } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found.' });
      return;
    }

    const settlement = await MonthlySettlement.findOne({ month: expense.month });
    if (settlement?.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: `Month ${expense.month} is LOCKED. Modifications are not allowed.`
      });
      return;
    }

    if (title) expense.title = title;
    if (category) expense.category = category;
    if (amount !== undefined) expense.amount = Number(amount);
    if (date) {
      expense.date = date;
      expense.month = date.slice(0, 7);
    }
    if (paidBy !== undefined) expense.paidBy = paidBy || null;
    if (sharingMethod) expense.sharingMethod = sharingMethod;
    if (includeInMealRate !== undefined) expense.includeInMealRate = Boolean(includeInMealRate);
    if (description !== undefined) expense.description = description;

    if (allocations) {
      expense.allocations = typeof allocations === 'string' ? JSON.parse(allocations) : allocations;
    }

    if (req.file) {
      expense.receiptImage = `/uploads/${req.file.filename}`;
    }

    await expense.save();

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'UPDATE_EXPENSE',
      module: 'EXPENSES',
      details: { id: expense._id, amount: expense.amount }
    });

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name memberCode')
      .populate('allocations.member', 'name memberCode');

    res.json({ success: true, message: 'Expense updated successfully.', expense: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found.' });
      return;
    }

    const settlement = await MonthlySettlement.findOne({ month: expense.month });
    if (settlement?.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: `Month ${expense.month} is LOCKED. Modifications are not allowed.`
      });
      return;
    }

    await Expense.findByIdAndDelete(id);

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'DELETE_EXPENSE',
      module: 'EXPENSES',
      details: { id, category: expense.category, amount: expense.amount }
    });

    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBuaCookBillHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buaBills = await Expense.find({ category: 'COOK_BUA' })
      .populate('paidBy', 'name memberCode')
      .sort({ date: -1 });

    const totalPaid = buaBills.reduce((sum, b) => sum + (b.amount || 0), 0);

    res.json({
      success: true,
      count: buaBills.length,
      totalPaid,
      buaBills
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

