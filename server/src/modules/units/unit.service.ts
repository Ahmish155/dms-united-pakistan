import { Types } from 'mongoose';
import { UnitModel } from './unit.model';
import { AuditLogModel } from '../audit/auditLog.model';
import { AppError } from '../../middleware/errorHandler';

export class UnitService {
  static async createUnit(
    workspaceId: string,
    data: {
      name: string;
      code: string;
      presidentPersonId?: string;
      generalSecretaryPersonId?: string;
    },
    userId: string
  ) {
    const existing = await UnitModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      $or: [{ name: data.name }, { code: data.code.toUpperCase() }]
    });

    if (existing) {
      throw new AppError('Unit with this name or code already exists in this sector', 409);
    }

    const unit = await UnitModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      name: data.name,
      code: data.code.toUpperCase(),
      presidentPersonId: data.presidentPersonId ? new Types.ObjectId(data.presidentPersonId) : undefined,
      generalSecretaryPersonId: data.generalSecretaryPersonId ? new Types.ObjectId(data.generalSecretaryPersonId) : undefined,
      isActive: true
    });

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'UNIT_CREATED',
      entityType: 'Unit',
      entityId: unit._id,
      newState: unit.toObject()
    });

    return unit;
  }

  static async getUnits(workspaceId: string) {
    return UnitModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isActive: true
    })
      .populate('presidentPersonId', 'fullName internalId')
      .populate('generalSecretaryPersonId', 'fullName internalId')
      .sort({ name: 1 })
      .lean();
  }

  static async getUnitById(workspaceId: string, id: string) {
    const unit = await UnitModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    })
      .populate('presidentPersonId', 'fullName internalId')
      .populate('generalSecretaryPersonId', 'fullName internalId')
      .lean();

    if (!unit) {
      throw new AppError('Unit not found', 404);
    }
    return unit;
  }

  static async updateUnit(
    workspaceId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      presidentPersonId?: string | null;
      generalSecretaryPersonId?: string | null;
      isActive?: boolean;
    },
    userId: string
  ) {
    const unit = await UnitModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!unit) {
      throw new AppError('Unit not found', 404);
    }

    const previousState = unit.toObject();

    if (data.name) unit.name = data.name;
    if (data.code) unit.code = data.code.toUpperCase();
    if (data.presidentPersonId !== undefined) {
      unit.presidentPersonId = data.presidentPersonId ? new Types.ObjectId(data.presidentPersonId) : undefined;
    }
    if (data.generalSecretaryPersonId !== undefined) {
      unit.generalSecretaryPersonId = data.generalSecretaryPersonId ? new Types.ObjectId(data.generalSecretaryPersonId) : undefined;
    }
    if (data.isActive !== undefined) {
      unit.isActive = data.isActive;
    }

    await unit.save();

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'UNIT_UPDATED',
      entityType: 'Unit',
      entityId: unit._id,
      previousState,
      newState: unit.toObject()
    });

    return unit;
  }
}
