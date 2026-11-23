import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUnitDoc extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  code: string;
  presidentPersonId?: Types.ObjectId;
  generalSecretaryPersonId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnitDoc>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    presidentPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'Person'
    },
    generalSecretaryPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'Person'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

UnitSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
UnitSchema.index({ workspaceId: 1, code: 1 }, { unique: true });

export const UnitModel =
  mongoose.models.Unit || mongoose.model<IUnitDoc>('Unit', UnitSchema);
