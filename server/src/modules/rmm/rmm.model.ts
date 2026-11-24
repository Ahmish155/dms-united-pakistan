import mongoose, { Schema, Document, Types } from 'mongoose';
import { PersonStage } from '@dms/shared';

export interface IRmmDoc extends Document {
  workspaceId: Types.ObjectId;
  unitId: Types.ObjectId;
  rmmDate: Date;
  weekStartDate: Date;
  weekEndDate: Date;
  plannedMaduMeetings: number;
  plannedMdfMeetings: number;
  comments?: string;
  status: 'ACTIVE' | 'ENDED';
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RmmSchema = new Schema<IRmmDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true
    },
    rmmDate: {
      type: Date,
      required: true
    },
    weekStartDate: {
      type: Date,
      required: true
    },
    weekEndDate: {
      type: Date,
      required: true
    },
    plannedMaduMeetings: {
      type: Number,
      required: true,
      default: 0
    },
    plannedMdfMeetings: {
      type: Number,
      required: true,
      default: 0
    },
    comments: {
      type: String
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ENDED'],
      default: 'ACTIVE'
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

RmmSchema.index({ workspaceId: 1, unitId: 1, weekStartDate: -1 });

export const RmmModel =
  mongoose.models.Rmm || mongoose.model<IRmmDoc>('Rmm', RmmSchema);

// RMM Target Entry
export interface IRmmTargetDoc extends Document {
  workspaceId: Types.ObjectId;
  rmmId: Types.ObjectId;
  personId: Types.ObjectId;
  category: PersonStage;
  nextWeekTarget: number;
  expectedDay?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RmmTargetSchema = new Schema<IRmmTargetDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    rmmId: {
      type: Schema.Types.ObjectId,
      ref: 'Rmm',
      required: true,
      index: true
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    },
    category: {
      type: String,
      enum: Object.values(PersonStage),
      required: true
    },
    nextWeekTarget: {
      type: Number,
      required: true,
      default: 0
    },
    expectedDay: {
      type: String
    }
  },
  { timestamps: true }
);

RmmTargetSchema.index({ rmmId: 1, personId: 1 }, { unique: true });

export const RmmTargetModel =
  mongoose.models.RmmTarget ||
  mongoose.model<IRmmTargetDoc>('RmmTarget', RmmTargetSchema);
