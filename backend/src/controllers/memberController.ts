import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Member } from '../models/Member';
import { User } from '../models/User';
import { Meal } from '../models/Meal';
import { Deposit } from '../models/Deposit';
import { MarketTransaction } from '../models/MarketTransaction';
import { AuditLog } from '../models/AuditLog';

export const getMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const query: any = {};

    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { memberCode: { $regex: search as string, $options: 'i' } },
        { phone: { $regex: search as string, $options: 'i' } },
        { roomNumber: { $regex: search as string, $options: 'i' } }
      ];
    }

    const members = await Member.find(query).sort({ memberCode: 1 });
    res.json({ success: true, count: members.length, members });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMemberById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const member = await Member.findById(id);

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    // If logged in as MEMBER role, they can only view their own profile
    if (req.user?.role === 'MEMBER' && req.user.memberId !== id) {
      res.status(403).json({ success: false, message: 'Unauthorized to view other member profiles.' });
      return;
    }

    // Fetch recent activity
    const recentMeals = await Meal.find({ member: id }).sort({ date: -1 }).limit(10);
    const recentDeposits = await Deposit.find({ member: id }).sort({ date: -1 }).limit(5);
    const recentMarket = await MarketTransaction.find({ purchasedBy: id }).sort({ date: -1 }).limit(5);

    // Calculate lifetime totals
    const allMeals = await Meal.find({ member: id });
    const totalMeals = allMeals.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

    const allDeposits = await Deposit.find({ member: id });
    const totalDeposits = allDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    const allMarket = await MarketTransaction.find({ purchasedBy: id });
    const totalMarketPaid = allMarket.reduce((sum, m) => sum + (m.totalAmount || 0), 0);

    res.json({
      success: true,
      member,
      stats: {
        totalMeals,
        totalDeposits,
        totalMarketPaid,
        runningBalance: member.currentBalance
      },
      recentActivity: {
        meals: recentMeals,
        deposits: recentDeposits,
        market: recentMarket
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      phone,
      email,
      address,
      emergencyContact,
      roomNumber,
      joiningDate,
      initialBalance,
      notes
    } = req.body;

    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Member name and phone number are required.' });
      return;
    }

    // Generate automatic unique Member Code: MEM-001, MEM-002...
    const count = await Member.countDocuments();
    const memberCode = `MEM-${String(count + 1).padStart(3, '0')}`;

    const newMember = await Member.create({
      memberCode,
      name,
      phone,
      email,
      address,
      emergencyContact,
      roomNumber,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: 'ACTIVE',
      currentBalance: Number(initialBalance) || 0,
      notes
    });

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'CREATE_MEMBER',
      module: 'MEMBERS',
      details: { memberCode: newMember.memberCode, name: newMember.name }
    });

    res.status(201).json({ success: true, message: 'Member created successfully.', member: newMember });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      address,
      emergencyContact,
      roomNumber,
      joiningDate,
      leavingDate,
      status,
      currentBalance,
      notes
    } = req.body;

    const member = await Member.findById(id);
    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (email !== undefined) member.email = email;
    if (address !== undefined) member.address = address;
    if (emergencyContact !== undefined) member.emergencyContact = emergencyContact;
    if (roomNumber !== undefined) member.roomNumber = roomNumber;
    if (joiningDate) member.joiningDate = new Date(joiningDate);
    if (leavingDate !== undefined) member.leavingDate = leavingDate ? new Date(leavingDate) : undefined;
    if (status) member.status = status;
    if (currentBalance !== undefined) member.currentBalance = Number(currentBalance);
    if (notes !== undefined) member.notes = notes;

    await member.save();

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'UPDATE_MEMBER',
      module: 'MEMBERS',
      details: { memberCode: member.memberCode, name: member.name }
    });

    res.json({ success: true, message: 'Member updated successfully.', member });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const member = await Member.findById(id);
    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }

    // Check if member has transactions
    const hasMeals = await Meal.exists({ member: id });
    const hasDeposits = await Deposit.exists({ member: id });
    const hasMarket = await MarketTransaction.exists({ purchasedBy: id });

    // If force is not requested and member has financial history, soft deactivate
    if ((hasMeals || hasDeposits || hasMarket) && force !== 'true') {
      member.status = 'INACTIVE';
      member.leavingDate = new Date();
      await member.save();

      await AuditLog.create({
        user: req.user?._id,
        userName: req.user?.name || 'Manager',
        action: 'DEACTIVATE_MEMBER',
        module: 'MEMBERS',
        details: { memberCode: member.memberCode, name: member.name }
      });

      res.json({
        success: true,
        isDeactivated: true,
        message: `Member "${member.name}" has transactions. Status was changed to INACTIVE. To permanently remove, select permanent delete.`,
        member
      });
      return;
    }

    // If force is true, cascade delete transactions to prevent orphaned records
    if (force === 'true') {
      await Promise.all([
        Meal.deleteMany({ member: id }),
        Deposit.deleteMany({ member: id }),
        MarketTransaction.deleteMany({ purchasedBy: id }),
        User.updateMany({ memberId: id }, { $set: { memberId: null } })
      ]);
    }

    await Member.findByIdAndDelete(id);

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'DELETE_MEMBER',
      module: 'MEMBERS',
      details: { memberCode: member.memberCode, name: member.name, force: force === 'true' }
    });

    res.json({ success: true, message: `Member "${member.name}" permanently deleted.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

