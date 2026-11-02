import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Member } from '../models/Member';
import { AuthRequest } from '../middleware/auth';
import { AuditLog } from '../models/AuditLog';

const generateToken = (user: any) => {
  const secret = process.env.JWT_SECRET || 'super_secret_mess_jwt_key_2026_xyz123!@#';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      memberId: user.memberId
    },
    secret,
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, memberId, phone, roomNumber } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered.' });
      return;
    }

    let assignedMemberId = memberId || null;
    const userRole = role || 'MEMBER';

    // If registering as a MEMBER without existing memberId, auto-link or create Member profile
    if (!assignedMemberId && userRole === 'MEMBER') {
      let existingMember = await Member.findOne({ email: email.toLowerCase() });
      if (existingMember) {
        assignedMemberId = existingMember._id;
      } else {
        const count = await Member.countDocuments();
        const nextCode = `MEM-${String(count + 1).padStart(3, '0')}`;
        const newMember = await Member.create({
          memberCode: nextCode,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone || '',
          roomNumber: roomNumber || '',
          address: 'Mess Resident',
          status: 'ACTIVE',
          currentBalance: 0,
          joiningDate: new Date()
        });
        assignedMemberId = newMember._id;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: userRole,
      memberId: assignedMemberId,
      isActive: true
    });

    if (assignedMemberId) {
      await Member.findByIdAndUpdate(assignedMemberId, { userId: newUser._id });
    }

    await AuditLog.create({
      user: newUser._id,
      userName: newUser.name,
      action: 'USER_REGISTER',
      module: 'AUTH',
      details: { email: newUser.email, role: newUser.role }
    });

    const token = generateToken(newUser);
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        memberId: newUser.memberId
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const token = generateToken(user);

    await AuditLog.create({
      user: user._id,
      userName: user.name,
      action: 'USER_LOGIN',
      module: 'AUTH'
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        memberId: user.memberId
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await User.findById(req.user._id).populate('memberId');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

