import mongoose, { Schema, Document, Types } from 'mongoose';
import { WorkspaceRole, DEFAULT_THRESHOLDS } from '@dms/shared';

// Workspace
export interface IWorkspaceDoc extends Document {
  name: string;
  code: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspaceDoc>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
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

export const WorkspaceModel =
  mongoose.models.Workspace ||
  mongoose.model<IWorkspaceDoc>('Workspace', WorkspaceSchema);

// Workspace Member
export interface IWorkspaceMemberDoc extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WorkspaceRole;
  grantedBy: Types.ObjectId;
  permissions: {
    canExportReports: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMemberDoc>(
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
    role: {
      type: String,
      enum: Object.values(WorkspaceRole),
      default: WorkspaceRole.SPECTATOR
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permissions: {
      canExportReports: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMemberModel =
  mongoose.models.WorkspaceMember ||
  mongoose.model<IWorkspaceMemberDoc>('WorkspaceMember', WorkspaceMemberSchema);

// Workspace Settings
export interface IWorkspaceSettingsDoc extends Document {
  workspaceId: Types.ObjectId;
  thresholds: {
    maduDays: number;
    mdfDays: number;
    daeenDays: number;
    dfDays: number;
    gmDays: number;
  };
  allowSpectatorExports: boolean;
}

const WorkspaceSettingsSchema = new Schema<IWorkspaceSettingsDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      unique: true
    },
    thresholds: {
      maduDays: { type: Number, default: DEFAULT_THRESHOLDS.maduDays },
      mdfDays: { type: Number, default: DEFAULT_THRESHOLDS.mdfDays },
      daeenDays: { type: Number, default: DEFAULT_THRESHOLDS.daeenDays },
      dfDays: { type: Number, default: DEFAULT_THRESHOLDS.dfDays },
      gmDays: { type: Number, default: DEFAULT_THRESHOLDS.gmDays }
    },
    allowSpectatorExports: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const WorkspaceSettingsModel =
  mongoose.models.WorkspaceSettings ||
  mongoose.model<IWorkspaceSettingsDoc>('WorkspaceSettings', WorkspaceSettingsSchema);
