import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MessSettings } from '../models/MessSettings';
import { AuditLog } from '../models/AuditLog';

export const getSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await MessSettings.findOne();
    if (!settings) {
      settings = await MessSettings.create({
        messName: 'Green View Smart Mess',
        currencySymbol: '৳',
        address: 'Sector 10, Uttara, Dhaka',
        managerName: 'Tanvir',
        contactNumber: '+8801740721194'
      });
    }
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      messName,
      currencySymbol,
      address,
      managerName,
      contactNumber,
      defaultMealConfig,
      eligibleMealExpenseCategories,
      autoLockClosedMonths
    } = req.body;

    let settings = await MessSettings.findOne();
    if (!settings) {
      settings = new MessSettings();
    }

    if (messName) settings.messName = messName;
    if (currencySymbol) settings.currencySymbol = currencySymbol;
    if (address) settings.address = address;
    if (managerName) settings.managerName = managerName;
    if (contactNumber) settings.contactNumber = contactNumber;
    if (defaultMealConfig) settings.defaultMealConfig = defaultMealConfig;
    if (eligibleMealExpenseCategories) settings.eligibleMealExpenseCategories = eligibleMealExpenseCategories;
    if (autoLockClosedMonths !== undefined) settings.autoLockClosedMonths = autoLockClosedMonths;

    await settings.save();

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'UPDATE_SETTINGS',
      module: 'SETTINGS',
      details: { messName: settings.messName }
    });

    res.json({ success: true, message: 'Settings updated successfully.', settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

