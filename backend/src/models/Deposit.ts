import mongoose, { Document, Schema } from 'mongoose';

export interface IDeposit extends Document {
  member: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  amount: number;
  paymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK';
  transactionId?: string;
  receiptImage?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DepositSchema = new Schema<IDeposit>(
  {
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    date: { type: String, required: true, index: true },
    month: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BKASH', 'NAGAD', 'BANK'],
      default: 'CASH'
    },
    transactionId: { type: String, default: '' },
    receiptImage: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const Deposit = mongoose.model<IDeposit>('Deposit', DepositSchema);

