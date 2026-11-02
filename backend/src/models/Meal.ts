import mongoose, { Document, Schema } from 'mongoose';

export interface IMeal extends Document {
  member: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeal: number;
  totalMeals: number;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MealSchema = new Schema<IMeal>(
  {
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    month: { type: String, required: true, index: true }, // Format: YYYY-MM
    breakfast: { type: Number, default: 0, min: 0 },
    lunch: { type: Number, default: 0, min: 0 },
    dinner: { type: Number, default: 0, min: 0 },
    guestMeal: { type: Number, default: 0, min: 0 },
    totalMeals: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

// Prevent duplicate meal records for the same member on the same date
MealSchema.index({ member: 1, date: 1 }, { unique: true });

// Auto-calculate total meals before saving
MealSchema.pre('save', function (next) {
  this.totalMeals = (this.breakfast || 0) + (this.lunch || 0) + (this.dinner || 0) + (this.guestMeal || 0);
  next();
});

export const Meal = mongoose.model<IMeal>('Meal', MealSchema);
