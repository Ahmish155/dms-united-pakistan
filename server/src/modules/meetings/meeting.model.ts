import mongoose, { Schema, Document, Types } from 'mongoose';
import { PersonStage } from '@dms/shared';

export interface IIndividualMeetingDoc extends Document {
  workspaceId: Types.ObjectId;
  unitId: Types.ObjectId;
  personId: Types.ObjectId;
  personStageAtTime: PersonStage;
  rabtakarId: Types.ObjectId;
  primaryDaeenId: Types.ObjectId;
  additionalDaeenIds: Types.ObjectId[];
  meetingDate: Date;
  meetingNumber: number;
  comments?: string;
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IndividualMeetingSchema = new Schema<IIndividualMeetingDoc>(
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
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
      index: true
    },
    personStageAtTime: {
      type: String,
      enum: Object.values(PersonStage),
      required: true
    },
    rabtakarId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
      index: true
    },
    primaryDaeenId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
      index: true
    },
    additionalDaeenIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Person'
      }
    ],
    meetingDate: {
      type: Date,
      required: true,
      index: true
    },
    meetingNumber: {
      type: Number,
      required: true,
      default: 1
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

IndividualMeetingSchema.index({ workspaceId: 1, meetingDate: -1 });
IndividualMeetingSchema.index({ workspaceId: 1, personId: 1, meetingDate: -1 });
IndividualMeetingSchema.index({ workspaceId: 1, rabtakarId: 1 });
IndividualMeetingSchema.index({ workspaceId: 1, primaryDaeenId: 1 });

export const IndividualMeetingModel =
  mongoose.models.IndividualMeeting ||
  mongoose.model<IIndividualMeetingDoc>(
    'IndividualMeeting',
    IndividualMeetingSchema
  );
