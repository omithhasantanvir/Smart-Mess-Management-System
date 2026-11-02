import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Meal } from '../models/Meal';
import { Member } from '../models/Member';
import { MonthlySettlement } from '../models/MonthlySettlement';
import { AuditLog } from '../models/AuditLog';

export const getDailyMeals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) {
      res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
      return;
    }

    const dateStr = date as string;
    const activeMembers = await Member.find({ status: 'ACTIVE' }).sort({ memberCode: 1 });
    const existingMeals = await Meal.find({ date: dateStr }).populate('member', 'name memberCode');

    const mealMap = new Map();
    existingMeals.forEach(m => {
      mealMap.set(m.member._id.toString(), m);
    });

    const rows = activeMembers.map(m => {
      const existing = mealMap.get(m._id.toString());
      return {
        memberId: m._id,
        memberCode: m.memberCode,
        memberName: m.name,
        breakfast: existing ? existing.breakfast : 0,
        lunch: existing ? existing.lunch : 0,
        dinner: existing ? existing.dinner : 0,
        guestMeal: existing ? existing.guestMeal : 0,
        totalMeals: existing ? existing.totalMeals : 0,
        notes: existing ? existing.notes : '',
        mealId: existing ? existing._id : null
      };
    });

    const totalMessMeals = rows.reduce((sum, r) => sum + r.totalMeals, 0);

    // Check if month is locked
    const month = dateStr.slice(0, 7);
    const settlement = await MonthlySettlement.findOne({ month });
    const isLocked = settlement?.status === 'LOCKED';

    res.json({
      success: true,
      date: dateStr,
      month,
      isLocked,
      totalMessMeals,
      members: rows
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkSaveDailyMeals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, entries } = req.body; // entries: [{ memberId, breakfast, lunch, dinner, guestMeal, notes }]

    if (!date || !Array.isArray(entries)) {
      res.status(400).json({ success: false, message: 'Date and meal entries array are required.' });
      return;
    }

    const month = date.slice(0, 7);
    const settlement = await MonthlySettlement.findOne({ month });
    if (settlement?.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: `Month ${month} is LOCKED. No modifications are permitted unless an administrator reopens the month.`
      });
      return;
    }

    const operations: any[] = entries.map(item => {
      const b = Number(item.breakfast) || 0;
      const l = Number(item.lunch) || 0;
      const d = Number(item.dinner) || 0;
      const g = Number(item.guestMeal) || 0;
      const total = b + l + d + g;

      return {
        updateOne: {
          filter: { member: item.memberId, date },
          update: {
            $set: {
              member: item.memberId,
              date,
              month,
              breakfast: b,
              lunch: l,
              dinner: d,
              guestMeal: g,
              totalMeals: total,
              notes: item.notes || '',
              createdBy: req.user?._id
            }
          },
          upsert: true
        }
      };
    });

    if (operations.length > 0) {
      await Meal.bulkWrite(operations);
    }

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: 'BULK_SAVE_DAILY_MEALS',
      module: 'MEALS',
      details: { date, count: operations.length }
    });

    res.json({ success: true, message: `Successfully saved daily meals for ${date}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyMeals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) {
      res.status(400).json({ success: false, message: 'Month parameter (YYYY-MM) is required.' });
      return;
    }

    const monthStr = month as string;
    const [year, mStr] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, mStr, 0).getDate();

    const members = await Member.find({ status: 'ACTIVE' }).sort({ memberCode: 1 });
    const meals = await Meal.find({ month: monthStr });

    // Build lookup: memberId -> date -> totalMeals
    const lookup: { [memberId: string]: { [day: number]: number } } = {};
    meals.forEach(meal => {
      const mId = meal.member.toString();
      const day = parseInt(meal.date.split('-')[2], 10);
      if (!lookup[mId]) lookup[mId] = {};
      lookup[mId][day] = meal.totalMeals;
    });

    // Generate table data
    const memberRows = members.map(m => {
      const mId = m._id.toString();
      const dailyCounts: { [day: number]: number } = {};
      let total = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const count = lookup[mId]?.[d] || 0;
        dailyCounts[d] = count;
        total += count;
      }
      return {
        memberId: m._id,
        memberCode: m.memberCode,
        memberName: m.name,
        days: dailyCounts,
        totalMeals: total
      };
    });

    // Daily totals across all members
    const dailyTotals: { [day: number]: number } = {};
    let grandTotal = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      let daySum = 0;
      memberRows.forEach(r => {
        daySum += r.days[d] || 0;
      });
      dailyTotals[d] = daySum;
      grandTotal += daySum;
    }

    res.json({
      success: true,
      month: monthStr,
      daysInMonth,
      grandTotal,
      dailyTotals,
      members: memberRows
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
