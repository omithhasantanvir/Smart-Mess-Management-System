import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  memberId?: mongoose.Types.ObjectId;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'MEMBER'],
      default: 'MEMBER'
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      default: null
    },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

