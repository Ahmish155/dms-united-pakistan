import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  WorkspaceModel,
  WorkspaceMemberModel,
  WorkspaceSettingsModel
} from './workspace.model';
import { AccessRequestModel } from '../access/accessRequest.model';
import { AuditLogModel } from '../audit/auditLog.model';
import {
  WorkspaceRole,
  AccessRequestStatus,
  DEFAULT_THRESHOLDS
} from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class WorkspaceService {
  static async createWorkspace(
    userId: string,
    data: { name: string; code: string }
  ) {
    const existing = await WorkspaceModel.findOne({
      code: data.code.toUpperCase()
    });
    if (existing) {
      throw new AppError('Workspace code already exists', 409);
    }

    const workspace = await WorkspaceModel.create({
      name: data.name,
      code: data.code.toUpperCase(),
      status: 'ACTIVE',
      createdById: new Types.ObjectId(userId)
    });

    // Create default settings
    await WorkspaceSettingsModel.create({
      workspaceId: workspace._id,
      thresholds: DEFAULT_THRESHOLDS,
      allowSpectatorExports: false
    });

    // Make the creator Sector Secretary
    await WorkspaceMemberModel.create({
      workspaceId: workspace._id,
      userId: new Types.ObjectId(userId),
      role: WorkspaceRole.SECTOR_SECRETARY,
      grantedBy: new Types.ObjectId(userId),
      permissions: { canExportReports: true }
    });

    // Audit log
    await AuditLogModel.create({
      workspaceId: workspace._id,
      userId: new Types.ObjectId(userId),
      action: 'WORKSPACE_CREATED',
      entityType: 'Workspace',
      entityId: workspace._id,
      newState: workspace.toObject()
    });

    return workspace;
  }

  static async getUserWorkspaces(userId: string) {
    const memberships = await WorkspaceMemberModel.find({
      userId: new Types.ObjectId(userId)
    })
      .populate('workspaceId')
      .lean();

    return memberships.map((m: any) => ({
      workspace: m.workspaceId,
      role: m.role,
      permissions: m.permissions
    }));
  }

  static async getWorkspaceDetails(workspaceId: string) {
    const workspace = await WorkspaceModel.findById(workspaceId).lean();
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }
    const settings = await WorkspaceSettingsModel.findOne({
      workspaceId
    }).lean();
    return { workspace, settings };
  }

  static async generateSpectatorInviteToken(
    workspaceId: string,
    secretaryUserId: string
  ) {
    const token = crypto.randomBytes(24).toString('hex');
    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(secretaryUserId),
      action: 'INVITE_LINK_GENERATED',
      entityType: 'AccessRequest',
      newState: { token }
    });
    return { token, link: `/join/${workspaceId}?token=${token}` };
  }

  static async requestSpectatorAccess(
    workspaceId: string,
    userId: string,
    token: string
  ) {
    // Check if user is already a member
    const existingMember = await WorkspaceMemberModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId)
    });
    if (existingMember) {
      throw new AppError('User is already a member of this workspace', 400);
    }

    // Check existing pending request
    const existingReq = await AccessRequestModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      status: AccessRequestStatus.PENDING
    });
    if (existingReq) {
      return existingReq;
    }

    const request = await AccessRequestModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      token,
      status: AccessRequestStatus.PENDING
    });

    return request;
  }

  static async getAccessRequests(workspaceId: string) {
    return AccessRequestModel.find({
      workspaceId: new Types.ObjectId(workspaceId)
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async decideAccessRequest(
    workspaceId: string,
    requestId: string,
    decision: AccessRequestStatus,
    decidedByUserId: string
  ) {
    const request = await AccessRequestModel.findOne({
      _id: new Types.ObjectId(requestId),
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!request) {
      throw new AppError('Access request not found', 404);
    }

    request.status = decision;
    request.decidedBy = new Types.ObjectId(decidedByUserId);
    request.decidedAt = new Date();
    await request.save();

    if (decision === AccessRequestStatus.APPROVED) {
      // Add or update member as SPECTATOR
      await WorkspaceMemberModel.findOneAndUpdate(
        {
          workspaceId: request.workspaceId,
          userId: request.userId
        },
        {
          role: WorkspaceRole.SPECTATOR,
          grantedBy: new Types.ObjectId(decidedByUserId),
          permissions: { canExportReports: false }
        },
        { upsert: true, new: true }
      );
    } else if (decision === AccessRequestStatus.REVOKED) {
      // Remove member immediately
      await WorkspaceMemberModel.findOneAndDelete({
        workspaceId: request.workspaceId,
        userId: request.userId
      });
    }

    // Audit log
    await AuditLogModel.create({
      workspaceId: request.workspaceId,
      userId: new Types.ObjectId(decidedByUserId),
      action: `SPECTATOR_ACCESS_${decision}`,
      entityType: 'AccessRequest',
      entityId: request._id,
      newState: { status: decision, targetUserId: request.userId }
    });

    return request;
  }
}
