import mongoose, { Document, Schema } from 'mongoose';

export interface IMessSettings extends Document {
  messName: string;
  currencySymbol: string; // ৳
  address: string;
  managerName: string;
  contactNumber: string;
  defaultMealConfig: {
    breakfastMultiplier: number;
    lunchMultiplier: number;
    dinnerMultiplier: number;
  };
  eligibleMealExpenseCategories: string[];
  autoLockClosedMonths: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessSettingsSchema = new Schema<IMessSettings>(
  {
    messName: { type: String, default: 'Green View Smart Mess' },
    currencySymbol: { type: String, default: '৳' },
    address: { type: String, default: 'Sector 10, Uttara, Dhaka' },
    managerName: { type: String, default: 'Tanvir' },
    contactNumber: { type: String, default: '+8801740721194' },
    defaultMealConfig: {
      breakfastMultiplier: { type: Number, default: 0.5 },
      lunchMultiplier: { type: Number, default: 1 },
      dinnerMultiplier: { type: Number, default: 1 }
    },
    eligibleMealExpenseCategories: {
      type: [String],
      default: ['GROCERY', 'FISH_MEAT', 'VEGETABLES', 'SPICES', 'GAS_CYLINDER']
    },
    autoLockClosedMonths: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const MessSettings = mongoose.model<IMessSettings>('MessSettings', MessSettingsSchema);

