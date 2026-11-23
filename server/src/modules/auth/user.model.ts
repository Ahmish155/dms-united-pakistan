import mongoose, { Schema, Document } from 'mongoose';
import { SystemRole } from '@dms/shared';

export interface IUserDoc extends Document {
  email: string;
  passwordHash: string;
  name: string;
  systemRole: SystemRole;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    systemRole: {
      type: String,
      enum: Object.values(SystemRole),
      default: SystemRole.STANDARD_USER
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema);
