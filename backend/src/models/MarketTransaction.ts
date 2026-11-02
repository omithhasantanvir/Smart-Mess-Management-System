import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketItem {
  name: string;
  quantity: number;
  unit: string; // kg, gm, piece, liter, packet
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface IMarketTransaction extends Document {
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  purchasedBy: mongoose.Types.ObjectId; // Member who paid
  items: IMarketItem[];
  totalAmount: number;
  category: string; // Primary category
  paymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'MESS_FUND';
  receiptImage?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarketItemSchema = new Schema<IMarketItem>(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'GROCERY' }
  },
  { _id: false }
);

const MarketTransactionSchema = new Schema<IMarketTransaction>(
  {
    date: { type: String, required: true, index: true },
    month: { type: String, required: true, index: true },
    purchasedBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    items: { type: [MarketItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['GROCERY', 'FISH_MEAT', 'VEGETABLES', 'SPICES', 'GAS_CYLINDER', 'OTHER'],
      default: 'GROCERY'
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BKASH', 'NAGAD', 'BANK', 'MESS_FUND'],
      default: 'CASH'
    },
    receiptImage: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const MarketTransaction = mongoose.model<IMarketTransaction>('MarketTransaction', MarketTransactionSchema);

