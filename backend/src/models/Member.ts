import mongoose, { Document, Schema } from 'mongoose';

export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export interface IMember extends Document {
  memberCode: string; // e.g. MEM-001
  name: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  roomNumber?: string;
  joiningDate: Date;
  leavingDate?: Date;
  status: MemberStatus;
  currentBalance: number; // Positive = Due/To pay, Negative = Advance/Surplus
  userId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    memberCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    roomNumber: { type: String, default: '' },
    joiningDate: { type: Date, default: Date.now },
    leavingDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    currentBalance: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Member = mongoose.model<IMember>('Member', MemberSchema);

