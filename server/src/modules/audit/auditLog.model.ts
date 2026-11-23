import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLogDoc extends Document {
  workspaceId?: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: Schema.Types.ObjectId
    },
    previousState: {
      type: Schema.Types.Mixed
    },
    newState: {
      type: Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

export const AuditLogModel =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDoc>('AuditLog', AuditLogSchema);
