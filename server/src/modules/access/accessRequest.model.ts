import mongoose, { Schema, Document, Types } from 'mongoose';
import { AccessRequestStatus } from '@dms/shared';

export interface IAccessRequestDoc extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  status: AccessRequestStatus;
  requestedAt: Date;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
}

const AccessRequestSchema = new Schema<IAccessRequestDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: Object.values(AccessRequestStatus),
      default: AccessRequestStatus.PENDING,
      index: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    decidedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const AccessRequestModel =
  mongoose.models.AccessRequest ||
  mongoose.model<IAccessRequestDoc>('AccessRequest', AccessRequestSchema);
