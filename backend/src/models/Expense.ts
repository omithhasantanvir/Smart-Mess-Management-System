import mongoose, { Document, Schema } from 'mongoose';

export type ExpenseCategory =
  | 'HOUSE_RENT'
  | 'ELECTRICITY'
  | 'GAS'
  | 'WATER'
  | 'WIFI'
  | 'SECURITY'
  | 'CLEANER'
  | 'COOK_BUA'
  | 'OTHER';

export type SharingMethod = 'EQUAL' | 'ACTIVE_DAYS' | 'CUSTOM';

export interface IExpenseAllocation {
  member: mongoose.Types.ObjectId;
  amount: number;
  activeDays?: number;
  percentage?: number;
}

export interface IExpense extends Document {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  paidBy?: mongoose.Types.ObjectId; // Member who paid or null (Mess fund)
  sharingMethod: SharingMethod;
  allocations: IExpenseAllocation[];
  includeInMealRate: boolean;
  receiptImage?: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseAllocationSchema = new Schema<IExpenseAllocation>(
  {
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true },
    activeDays: { type: Number, default: 30 },
    percentage: { type: Number, default: 0 }
  },
  { _id: false }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'HOUSE_RENT',
        'ELECTRICITY',
        'GAS',
        'WATER',
        'WIFI',
        'SECURITY',
        'CLEANER',
        'COOK_BUA',
        'OTHER'
      ],
      required: true,
      index: true
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true, index: true },
    month: { type: String, required: true, index: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
    sharingMethod: {
      type: String,
      enum: ['EQUAL', 'ACTIVE_DAYS', 'CUSTOM'],
      default: 'EQUAL'
    },
    allocations: { type: [ExpenseAllocationSchema], default: [] },
    includeInMealRate: { type: Boolean, default: false },
    receiptImage: { type: String, default: '' },
    description: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);

