import mongoose, { Schema, Document, Types } from 'mongoose';
import { PersonStage, OrganizationalResponsibility, OperationalStatus } from '@dms/shared';

export interface IPersonDoc extends Document {
  workspaceId: Types.ObjectId;
  internalId: string;
  fullName: string;
  contactNumber?: string;
  currentUnitId?: Types.ObjectId;
  assignedUnitIds?: Types.ObjectId[];
  currentStage: PersonStage;
  operationalStatus?: OperationalStatus;
  roles: OrganizationalResponsibility[];
  primaryRabtakarId?: Types.ObjectId;
  defaultDaeenId?: Types.ObjectId;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonSchema = new Schema<IPersonDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    internalId: {
      type: String,
      required: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    contactNumber: {
      type: String,
      trim: true
    },
    currentUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: false,
      index: true
    },
    assignedUnitIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Unit'
      }
    ],
    currentStage: {
      type: String,
      enum: Object.values(PersonStage),
      default: PersonStage.MADU,
      index: true
    },
    operationalStatus: {
      type: String,
      enum: Object.values(OperationalStatus),
      default: OperationalStatus.ACTIVE,
      index: true
    },
    roles: [
      {
        type: String,
        enum: Object.values(OrganizationalResponsibility)
      }
    ],
    primaryRabtakarId: {
      type: Schema.Types.ObjectId,
      ref: 'Person'
    },
    defaultDaeenId: {
      type: Schema.Types.ObjectId,
      ref: 'Person'
    },
    notes: {
      type: String
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

PersonSchema.index({ workspaceId: 1, internalId: 1 }, { unique: true });
PersonSchema.index({ workspaceId: 1, currentUnitId: 1 });
PersonSchema.index({ workspaceId: 1, currentStage: 1 });
PersonSchema.index({ workspaceId: 1, roles: 1 });

export const PersonModel =
  mongoose.models.Person || mongoose.model<IPersonDoc>('Person', PersonSchema);

// Promotion History
export interface IPromotionHistoryDoc extends Document {
  workspaceId: Types.ObjectId;
  personId: Types.ObjectId;
  fromStage: PersonStage;
  toStage: PersonStage;
  promotedAt: Date;
  promotedBy: Types.ObjectId;
  remarks?: string;
}

const PromotionHistorySchema = new Schema<IPromotionHistoryDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
      index: true
    },
    fromStage: {
      type: String,
      enum: Object.values(PersonStage),
      required: true
    },
    toStage: {
      type: String,
      enum: Object.values(PersonStage),
      required: true
    },
    promotedAt: {
      type: Date,
      default: Date.now
    },
    promotedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    remarks: {
      type: String
    }
  },
  { timestamps: true }
);

export const PromotionHistoryModel =
  mongoose.models.PromotionHistory ||
  mongoose.model<IPromotionHistoryDoc>('PromotionHistory', PromotionHistorySchema);

// Unit Assignment History
export interface IUnitAssignmentHistoryDoc extends Document {
  workspaceId: Types.ObjectId;
  personId: Types.ObjectId;
  fromUnitId: Types.ObjectId;
  toUnitId: Types.ObjectId;
  transferredAt: Date;
  transferredBy: Types.ObjectId;
  remarks?: string;
}

const UnitAssignmentHistorySchema = new Schema<IUnitAssignmentHistoryDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
      index: true
    },
    fromUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true
    },
    toUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true
    },
    transferredAt: {
      type: Date,
      default: Date.now
    },
    transferredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    remarks: {
      type: String
    }
  },
  { timestamps: true }
);

export const UnitAssignmentHistoryModel =
  mongoose.models.UnitAssignmentHistory ||
  mongoose.model<IUnitAssignmentHistoryDoc>(
    'UnitAssignmentHistory',
    UnitAssignmentHistorySchema
  );
