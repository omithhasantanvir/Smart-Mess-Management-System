import mongoose, { Document, Schema } from 'mongoose';

export type MonthStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface IMemberSettlementDoc {
  member: mongoose.Types.ObjectId;
  memberName: string;
  totalMeals: number;
  mealRate: number;
  mealCost: number;
  sharedBills: number;
  sharedBillsBreakdown: { [category: string]: number };
  individualExtra: number;
  totalCost: number;
  marketPaid: number;
  depositsPaid: number;
  totalCredit: number;
  previousBalance: number;
  finalBalance: number;
  status: 'TO_PAY' | 'TO_RECEIVE' | 'SETTLED';
}

export interface IMonthlySettlement extends Document {
  month: string; // YYYY-MM
  status: MonthStatus;
  totalMembers: number;
  totalMessMeals: number;
  totalMarketCost: number;
  eligibleMealExpenses: number;
  calculatedMillRate: number;
  appliedMillRate: number;
  totalSharedExpenses: number;
  totalCookBill: number;
  totalDeposits: number;
  totalMemberCosts: number;
  totalCredits: number;
  netMessBalance: number;
  memberSettlements: IMemberSettlementDoc[];
  closedBy?: mongoose.Types.ObjectId;
  closedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSettlementSubSchema = new Schema<IMemberSettlementDoc>(
  {
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: { type: String, required: true },
    totalMeals: { type: Number, default: 0 },
    mealRate: { type: Number, default: 0 },
    mealCost: { type: Number, default: 0 },
    sharedBills: { type: Number, default: 0 },
    sharedBillsBreakdown: { type: Schema.Types.Mixed, default: {} },
    individualExtra: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    marketPaid: { type: Number, default: 0 },
    depositsPaid: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    previousBalance: { type: Number, default: 0 },
    finalBalance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['TO_PAY', 'TO_RECEIVE', 'SETTLED'],
      default: 'SETTLED'
    }
  },
  { _id: false }
);

const MonthlySettlementSchema = new Schema<IMonthlySettlement>(
  {
    month: { type: String, required: true, unique: true, index: true }, // Format: YYYY-MM
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'LOCKED'],
      default: 'OPEN',
      index: true
    },
    totalMembers: { type: Number, default: 0 },
    totalMessMeals: { type: Number, default: 0 },
    totalMarketCost: { type: Number, default: 0 },
    eligibleMealExpenses: { type: Number, default: 0 },
    calculatedMillRate: { type: Number, default: 0 },
    appliedMillRate: { type: Number, default: 0 },
    totalSharedExpenses: { type: Number, default: 0 },
    totalCookBill: { type: Number, default: 0 },
    totalDeposits: { type: Number, default: 0 },
    totalMemberCosts: { type: Number, default: 0 },
    totalCredits: { type: Number, default: 0 },
    netMessBalance: { type: Number, default: 0 },
    memberSettlements: { type: [MemberSettlementSubSchema], default: [] },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt: { type: Date, default: null },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const MonthlySettlement = mongoose.model<IMonthlySettlement>(
  'MonthlySettlement',
  MonthlySettlementSchema
);

