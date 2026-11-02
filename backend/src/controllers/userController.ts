import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { AuditLog } from '../models/AuditLog';

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().populate('memberId', 'name memberCode phone').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (role && ['ADMIN', 'MANAGER', 'MEMBER'].includes(role)) {
      user.role = role;
    }
    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    await user.save();

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'UPDATE_USER_ROLE',
      module: 'USERS',
      details: { targetUser: user.email, role: user.role, isActive: user.isActive }
    });

    res.json({ success: true, message: 'User updated successfully.', user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(id, { password: hashedPassword });

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

