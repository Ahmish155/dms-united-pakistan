import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAiBatchLogDoc extends Document {
  workspaceId: Types.ObjectId;
  batchId: string;
  rawText: string;
  summary: string;
  createdEntities: Array<{
    entityType: 'Person' | 'IndividualMeeting' | 'DialogueForum' | 'GroupMeeting' | 'Rmm' | 'Dmm';
    entityId: Types.ObjectId;
  }>;
  userId: Types.ObjectId;
  isReverted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AiBatchLogSchema = new Schema<IAiBatchLogDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    rawText: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      default: ''
    },
    createdEntities: [
      {
        entityType: {
          type: String,
          enum: ['Person', 'IndividualMeeting', 'DialogueForum', 'GroupMeeting', 'Rmm', 'Dmm'],
          required: true
        },
        entityId: {
          type: Schema.Types.ObjectId,
          required: true
        }
      }
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isReverted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const AiBatchLogModel =
  mongoose.models.AiBatchLog ||
  mongoose.model<IAiBatchLogDoc>('AiBatchLog', AiBatchLogSchema);
