import mongoose, { Schema, Document, Types } from 'mongoose';
import { DmmStatus, PersonStage } from '@dms/shared';

// DMM (Monthly Planning Document)
export interface IDmmDoc extends Document {
  workspaceId: Types.ObjectId;
  month: number;
  year: number;
  status: DmmStatus;
  sessionStatus: 'ACTIVE' | 'ENDED';
  expectedMscCount: number;
  expectedMdfCount: number;
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DmmSchema = new Schema<IDmmDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(DmmStatus),
      default: DmmStatus.DRAFT
    },
    sessionStatus: {
      type: String,
      enum: ['ACTIVE', 'ENDED'],
      default: 'ACTIVE'
    },
    expectedMscCount: {
      type: Number,
      default: 0
    },
    expectedMdfCount: {
      type: Number,
      default: 0
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

DmmSchema.index({ workspaceId: 1, year: 1, month: 1, sessionStatus: 1 });

export const DmmModel =
  mongoose.models.Dmm || mongoose.model<IDmmDoc>('Dmm', DmmSchema);

// DMM Target Entry
export interface IDmmTargetDoc extends Document {
  workspaceId: Types.ObjectId;
  dmmId: Types.ObjectId;
  unitId: Types.ObjectId;
  personId: Types.ObjectId;
  category: PersonStage;
  targetMeetings: number;
  rabtakarId: Types.ObjectId;
  daeenId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DmmTargetSchema = new Schema<IDmmTargetDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    dmmId: {
      type: Schema.Types.ObjectId,
      ref: 'Dmm',
      required: true,
      index: true
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: Object.values(PersonStage),
      required: true
    },
    targetMeetings: {
      type: Number,
      required: true,
      default: 0
    },
    rabtakarId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    },
    daeenId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    }
  },
  { timestamps: true }
);

DmmTargetSchema.index({ dmmId: 1, personId: 1 }, { unique: true });

export const DmmTargetModel =
  mongoose.models.DmmTarget ||
  mongoose.model<IDmmTargetDoc>('DmmTarget', DmmTargetSchema);
