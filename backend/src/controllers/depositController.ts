import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Deposit } from '../models/Deposit';
import { MonthlySettlement } from '../models/MonthlySettlement';
import { AuditLog } from '../models/AuditLog';

export const getDeposits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, date, member, paymentMethod } = req.query;
    const query: any = {};

    if (month && month !== 'undefined') query.month = month;
    if (date && date !== 'undefined') query.date = date;
    if (member && member !== 'undefined' && member !== 'null' && member !== '') query.member = member;
    if (paymentMethod && paymentMethod !== 'undefined' && paymentMethod !== 'null' && paymentMethod !== '') {
      query.paymentMethod = paymentMethod;
    }

    const deposits = await Deposit.find(query)
      .populate('member', 'name memberCode')
      .sort({ date: -1, createdAt: -1 });

    const totalAmount = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    res.json({
      success: true,
      count: deposits.length,
      totalAmount,
      deposits
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { member, date, amount, paymentMethod, transactionId, notes } = req.body;

    if (!member || !date || !amount) {
      res.status(400).json({ success: false, message: 'Member, date, and amount are required.' });
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

    const deposit = await Deposit.create({
      member,
      date,
      month,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'CASH',
      transactionId: transactionId || '',
      receiptImage,
      notes: notes || '',
      createdBy: req.user?._id
    });

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'CREATE_DEPOSIT',
      module: 'DEPOSITS',
      details: { id: deposit._id, amount, member, date }
    });

    const populated = await Deposit.findById(deposit._id).populate('member', 'name memberCode');

    res.status(201).json({
      success: true,
      message: 'Deposit recorded successfully.',
      deposit: populated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { member, date, amount, paymentMethod, transactionId, notes } = req.body;

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      res.status(404).json({ success: false, message: 'Deposit not found.' });
      return;
    }

    const settlement = await MonthlySettlement.findOne({ month: deposit.month });
    if (settlement?.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: `Month ${deposit.month} is LOCKED. Modifications are not allowed.`
      });
      return;
    }

    if (member) deposit.member = member;
    if (date) {
      deposit.date = date;
      deposit.month = date.slice(0, 7);
    }
    if (amount !== undefined) deposit.amount = Number(amount);
    if (paymentMethod) deposit.paymentMethod = paymentMethod;
    if (transactionId !== undefined) deposit.transactionId = transactionId;
    if (notes !== undefined) deposit.notes = notes;

    if (req.file) {
      deposit.receiptImage = `/uploads/${req.file.filename}`;
    }

    await deposit.save();

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'UPDATE_DEPOSIT',
      module: 'DEPOSITS',
      details: { id: deposit._id, amount: deposit.amount }
    });

    const populated = await Deposit.findById(deposit._id).populate('member', 'name memberCode');

    res.json({ success: true, message: 'Deposit updated successfully.', deposit: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deposit = await Deposit.findById(id);
    if (!deposit) {
      res.status(404).json({ success: false, message: 'Deposit not found.' });
      return;
    }

    const settlement = await MonthlySettlement.findOne({ month: deposit.month });
    if (settlement?.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: `Month ${deposit.month} is LOCKED. Modifications are not allowed.`
      });
      return;
    }

    await Deposit.findByIdAndDelete(id);

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'DELETE_DEPOSIT',
      module: 'DEPOSITS',
      details: { id, amount: deposit.amount, date: deposit.date }
    });

    res.json({ success: true, message: 'Deposit deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

