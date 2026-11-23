import mongoose, { Schema, Document, Types } from 'mongoose';
import { ParticipantCategory } from '@dms/shared';

// DF Mentor
export interface IDfMentorDoc extends Document {
  workspaceId: Types.ObjectId;
  personId?: Types.ObjectId;
  name: string;
  contact?: string;
  specialization?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DfMentorSchema = new Schema<IDfMentorDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    specialization: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const DfMentorModel =
  mongoose.models.DfMentor ||
  mongoose.model<IDfMentorDoc>('DfMentor', DfMentorSchema);

// Dialogue Forum Session
export interface IDialogueForumDoc extends Document {
  workspaceId: Types.ObjectId;
  unitId: Types.ObjectId;
  date: Date;
  mentorId: Types.ObjectId;
  topic?: string;
  comments?: string;
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DialogueForumSchema = new Schema<IDialogueForumDoc>(
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
    date: {
      type: Date,
      required: true,
      index: true
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'DfMentor',
      required: true
    },
    topic: {
      type: String,
      trim: true
    },
    comments: {
      type: String,
      trim: true
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

export const DialogueForumModel =
  mongoose.models.DialogueForum ||
  mongoose.model<IDialogueForumDoc>('DialogueForum', DialogueForumSchema);

// DF Attendance
export interface IDfAttendanceDoc extends Document {
  workspaceId: Types.ObjectId;
  dfId: Types.ObjectId;
  personId: Types.ObjectId;
  category: ParticipantCategory;
  status: 'ATTENDED' | 'ABSENT';
}

const DfAttendanceSchema = new Schema<IDfAttendanceDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    dfId: {
      type: Schema.Types.ObjectId,
      ref: 'DialogueForum',
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
      enum: Object.values(ParticipantCategory),
      default: ParticipantCategory.OTHER
    },
    status: {
      type: String,
      enum: ['ATTENDED', 'ABSENT'],
      default: 'ATTENDED'
    }
  },
  { timestamps: true }
);

DfAttendanceSchema.index({ dfId: 1, personId: 1 }, { unique: true });

export const DfAttendanceModel =
  mongoose.models.DfAttendance ||
  mongoose.model<IDfAttendanceDoc>('DfAttendance', DfAttendanceSchema);
