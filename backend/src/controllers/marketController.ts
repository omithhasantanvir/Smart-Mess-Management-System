import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MarketTransaction } from '../models/MarketTransaction';
import { MonthlySettlement } from '../models/MonthlySettlement';
import { AuditLog } from '../models/AuditLog';

export const getMarketTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, date, purchasedBy, category } = req.query;
    const query: any = {};

    if (month && month !== 'undefined') query.month = month;
    if (date && date !== 'undefined') query.date = date;
    if (purchasedBy && purchasedBy !== 'undefined' && purchasedBy !== 'null' && purchasedBy !== '') {
      query.purchasedBy = purchasedBy;
    }
    if (category && category !== 'undefined' && category !== 'null' && category !== '') {
      query.category = category;
    }

    // Member portal constraint: if logged in as member, they can optionally view all mess bazar or their own
    const transactions = await MarketTransaction.find(query)
      .populate('purchasedBy', 'name memberCode')
      .sort({ date: -1, createdAt: -1 });

    const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    res.json({
      success: true,
      count: transactions.length,
      totalAmount,
      transactions
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMarketTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      date,
      purchasedBy,
      items,
      category,
      paymentMethod,
      notes,
      totalAmount: rawTotal
    } = req.body;

    if (!date || !purchasedBy) {
      res.status(400).json({ success: false, message: 'Date and Purchased By member are required.' });
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

    let parsedItems = [];
    if (typeof items === 'string') {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        parsedItems = [];
      }
    } else if (Array.isArray(items)) {
      parsedItems = items;
    }

    let totalAmount = Number(rawTotal) || 0;
    if (parsedItems.length > 0) {
      totalAmount = parsedItems.reduce(
        (sum: number, it: any) => sum + (Number(it.totalPrice) || (Number(it.quantity) * Number(it.unitPrice)) || 0),
        0
      );
    }

    let receiptImage = '';
    if (req.file) {
      receiptImage = `/uploads/${req.file.filename}`;
    }

    const newTransaction = await MarketTransaction.create({
      date,
      month,
      purchasedBy,
      items: parsedItems,
      totalAmount,
      category: category || 'GROCERY',
      paymentMethod: paymentMethod || 'CASH',
      receiptImage,
      notes: notes || '',
      createdBy: req.user?._id
    });

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'CREATE_MARKET_TRANSACTION',
      module: 'MARKET',
      details: { id: newTransaction._id, amount: totalAmount, date }
    });

    const populated = await MarketTransaction.findById(newTransaction._id).populate(
      'purchasedBy',
      'name memberCode'
    );

    res.status(201).json({
      success: true,
      message: 'Market transaction recorded successfully.',
      transaction: populated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMarketTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      date,
      purchasedBy,
      items,
      category,
      paymentMethod,
      notes,
      totalAmount: rawTotal
    } = req.body;

    const transaction = await MarketTransaction.findById(id);
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    const settlement = await MonthlySettlement.findOne({ month: transaction.month });
    if (settlement?.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: `Month ${transaction.month} is LOCKED. Modifications are not allowed.`
      });
      return;
    }

    if (date) {
      transaction.date = date;
      transaction.month = date.slice(0, 7);
    }
    if (purchasedBy) transaction.purchasedBy = purchasedBy;
    if (category) transaction.category = category;
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (notes !== undefined) transaction.notes = notes;

    if (items) {
      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      transaction.items = parsedItems;
      transaction.totalAmount = parsedItems.reduce(
        (sum: number, it: any) => sum + (Number(it.totalPrice) || (Number(it.quantity) * Number(it.unitPrice)) || 0),
        0
      );
    } else if (rawTotal !== undefined) {
      transaction.totalAmount = Number(rawTotal);
    }

    if (req.file) {
      transaction.receiptImage = `/uploads/${req.file.filename}`;
    }

    await transaction.save();

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'UPDATE_MARKET_TRANSACTION',
      module: 'MARKET',
      details: { id: transaction._id, amount: transaction.totalAmount }
    });

    const populated = await MarketTransaction.findById(transaction._id).populate(
      'purchasedBy',
      'name memberCode'
    );

    res.json({ success: true, message: 'Market transaction updated.', transaction: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMarketTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await MarketTransaction.findById(id);
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    const settlement = await MonthlySettlement.findOne({ month: transaction.month });
    if (settlement?.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: `Month ${transaction.month} is LOCKED. Modifications are not allowed.`
      });
      return;
    }

    await MarketTransaction.findByIdAndDelete(id);

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'DELETE_MARKET_TRANSACTION',
      module: 'MARKET',
      details: { id, amount: transaction.totalAmount, date: transaction.date }
    });

    res.json({ success: true, message: 'Market transaction deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMarketSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.query;
    if (!month) {
      res.status(400).json({ success: false, message: 'Month (YYYY-MM) is required.' });
      return;
    }

    const transactions = await MarketTransaction.find({ month: month as string }).populate(
      'purchasedBy',
      'name memberCode'
    );

    let totalCost = 0;
    const categoryTotals: { [key: string]: number } = {};
    const memberTotals: { [memberId: string]: { name: string; memberCode: string; amount: number } } = {};

    transactions.forEach(t => {
      totalCost += t.totalAmount;

      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.totalAmount;

      const mem: any = t.purchasedBy;
      if (mem) {
        const id = mem._id.toString();
        if (!memberTotals[id]) {
          memberTotals[id] = { name: mem.name, memberCode: mem.memberCode, amount: 0 };
        }
        memberTotals[id].amount += t.totalAmount;
      }
    });

    res.json({
      success: true,
      month,
      totalCost,
      categoryBreakdown: categoryTotals,
      memberContributions: Object.values(memberTotals)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

