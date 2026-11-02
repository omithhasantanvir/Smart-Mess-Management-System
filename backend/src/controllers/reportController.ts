import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';
import { Member } from '../models/Member';
import { Meal } from '../models/Meal';
import { MarketTransaction } from '../models/MarketTransaction';
import { Deposit } from '../models/Deposit';
import { Expense } from '../models/Expense';
import { MonthlySettlement } from '../models/MonthlySettlement';
import { calculateMonthlySettlement } from '../services/financialCalculation';

export const exportMonthlySettlementExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.query;
    if (!month) {
      res.status(400).json({ success: false, message: 'Month parameter is required.' });
      return;
    }

    const monthStr = month as string;
    const activeMembers = await Member.find().sort({ memberCode: 1 });
    const meals = await Meal.find({ month: monthStr });
    const marketTx = await MarketTransaction.find({ month: monthStr });
    const depositsList = await Deposit.find({ month: monthStr });
    const expensesList = await Expense.find({ month: monthStr });

    const memberMap = new Map();
    meals.forEach(m => {
      const id = m.member.toString();
      memberMap.set(id, (memberMap.get(id) || 0) + (m.totalMeals || 0));
    });

    const calculated = calculateMonthlySettlement({
      month: monthStr,
      activeMembers: activeMembers.map(m => ({
        memberId: m._id.toString(),
        memberName: m.name,
        activeDaysInMonth: 30,
        daysInMonth: 30,
        status: m.status,
        previousBalance: m.currentBalance || 0
      })),
      memberMeals: activeMembers.map(m => ({
        memberId: m._id.toString(),
        memberName: m.name,
        totalMeals: memberMap.get(m._id.toString()) || 0
      })),
      marketPurchases: marketTx.map(t => ({
        memberId: t.purchasedBy.toString(),
        amount: t.totalAmount
      })),
      deposits: depositsList.map(d => ({
        memberId: d.member.toString(),
        amount: d.amount
      })),
      sharedExpenses: expensesList.map(e => ({
        title: e.title,
        category: e.category,
        amount: e.amount,
        sharingMethod: e.sharingMethod,
        includeInMealRate: e.includeInMealRate
      }))
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Settlement ${monthStr}`);

    // Mess Title & Header
    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `SMART MESS MANAGEMENT SYSTEM - MONTHLY SETTLEMENT (${monthStr})`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;

    // Summary KPIs
    sheet.addRow([
      `Total Mess Meals: ${calculated.totalMessMeals}`,
      '',
      `Total Market: ৳${calculated.totalMarketCost}`,
      '',
      `Mill Rate: ৳${calculated.appliedMillRate}`,
      '',
      `House Bills: ৳${calculated.totalSharedExpenses}`,
      '',
      `Total Deposits: ৳${calculated.totalDeposits}`
    ]);
    sheet.getRow(2).font = { bold: true };
    sheet.addRow([]);

    // Table Headers
    const headers = [
      'Member Code',
      'Member Name',
      'Total Meals',
      'Meal Cost (৳)',
      'Shared Bills (৳)',
      'Total Cost (৳)',
      'Market Paid (৳)',
      'Deposits (৳)',
      'Total Credit (৳)',
      'Prev Due (৳)',
      'Final Balance (৳)',
      'Status'
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    headerRow.height = 25;

    calculated.memberSettlements.forEach(m => {
      const activeMem = activeMembers.find(x => x._id.toString() === m.memberId);
      const row = sheet.addRow([
        activeMem?.memberCode || 'MEM',
        m.memberName,
        m.totalMeals,
        m.mealCost,
        m.sharedBills,
        m.totalCost,
        m.marketPaid,
        m.depositsPaid,
        m.totalCredit,
        m.previousBalance,
        m.finalBalance,
        m.status
      ]);

      const balCell = row.getCell(11);
      if (m.finalBalance > 0) {
        balCell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red for To Pay
      } else if (m.finalBalance < 0) {
        balCell.font = { color: { argb: 'FF16A34A' }, bold: true }; // Green for To Receive
      }
    });

    sheet.columns.forEach(col => {
      col.width = 16;
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Mess_Settlement_${monthStr}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

