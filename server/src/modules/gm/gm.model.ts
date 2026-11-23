import mongoose, { Schema, Document, Types } from 'mongoose';
import { ParticipantCategory } from '@dms/shared';

// Group Meeting Session
export interface IGroupMeetingDoc extends Document {
  workspaceId: Types.ObjectId;
  unitId: Types.ObjectId;
  date: Date;
  facilitatorPersonId?: Types.ObjectId;
  topic?: string;
  comments?: string;
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupMeetingSchema = new Schema<IGroupMeetingDoc>(
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
    facilitatorPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'Person'
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

export const GroupMeetingModel =
  mongoose.models.GroupMeeting ||
  mongoose.model<IGroupMeetingDoc>('GroupMeeting', GroupMeetingSchema);

// GM Attendance
export interface IGmAttendanceDoc extends Document {
  workspaceId: Types.ObjectId;
  gmId: Types.ObjectId;
  personId: Types.ObjectId;
  category: ParticipantCategory;
  status: 'ATTENDED' | 'ABSENT';
}

const GmAttendanceSchema = new Schema<IGmAttendanceDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    gmId: {
      type: Schema.Types.ObjectId,
      ref: 'GroupMeeting',
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

GmAttendanceSchema.index({ gmId: 1, personId: 1 }, { unique: true });

export const GmAttendanceModel =
  mongoose.models.GmAttendance ||
  mongoose.model<IGmAttendanceDoc>('GmAttendance', GmAttendanceSchema);
