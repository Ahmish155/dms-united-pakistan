import { Types } from 'mongoose';
import { WorkspaceSettingsModel } from '../workspaces/workspace.model';
import { AuditLogModel } from '../audit/auditLog.model';
import { DEFAULT_THRESHOLDS } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class SettingsService {
  static async getSettings(workspaceId: string) {
    let settings = await WorkspaceSettingsModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId)
    }).lean();

    if (!settings) {
      settings = await WorkspaceSettingsModel.create({
        workspaceId: new Types.ObjectId(workspaceId),
        thresholds: DEFAULT_THRESHOLDS,
        allowSpectatorExports: false
      });
    }

    return settings;
  }

  static async updateSettings(
    workspaceId: string,
    data: {
      thresholds?: {
        maduDays?: number;
        mdfDays?: number;
        daeenDays?: number;
        dfDays?: number;
        gmDays?: number;
      };
      allowSpectatorExports?: boolean;
    },
    userId: string
  ) {
    const settings = await WorkspaceSettingsModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!settings) {
      throw new AppError('Workspace settings not found', 404);
    }

    const previousState = settings.toObject();

    if (data.thresholds) {
      settings.thresholds = {
        ...settings.thresholds,
        ...data.thresholds
      };
    }

    if (data.allowSpectatorExports !== undefined) {
      settings.allowSpectatorExports = data.allowSpectatorExports;
    }

    await settings.save();

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'SETTINGS_UPDATED',
      entityType: 'WorkspaceSettings',
      entityId: settings._id,
      previousState,
      newState: settings.toObject()
    });

    return settings;
  }
}
