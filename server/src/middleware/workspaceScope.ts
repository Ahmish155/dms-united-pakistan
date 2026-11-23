import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { WorkspaceRole, SystemRole } from '@dms/shared';
import {
  WorkspaceMemberModel,
  WorkspaceModel,
  IWorkspaceDoc,
  IWorkspaceMemberDoc
} from '../modules/workspaces/workspace.model';
import { AppError } from './errorHandler';

export const requireWorkspace = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required prior to workspace access.', 401);
    }

    const rawWorkspaceId =
      req.headers['x-workspace-id'] ||
      req.params.workspaceId ||
      req.query.workspaceId;

    if (!rawWorkspaceId || typeof rawWorkspaceId !== 'string') {
      throw new AppError('Workspace context missing. Provide x-workspace-id header or parameter.', 400);
    }

    if (!Types.ObjectId.isValid(rawWorkspaceId)) {
      throw new AppError('Invalid workspace identifier format.', 400);
    }

    const workspace = (await WorkspaceModel.findById(rawWorkspaceId).exec()) as IWorkspaceDoc | null;
    if (!workspace || workspace.status !== 'ACTIVE') {
      throw new AppError('Workspace not found or archived.', 404);
    }

    const member = (await WorkspaceMemberModel.findOne({
      workspaceId: new Types.ObjectId(rawWorkspaceId),
      userId: new Types.ObjectId(req.user.id)
    }).exec()) as IWorkspaceMemberDoc | null;

    // Check permissions
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

    // If user is not an explicit member of the workspace
    if (!member) {
      // Super Admin check: Super admin cannot edit workspace contents without explicit Sector Secretary delegation
      if (req.user.systemRole === SystemRole.SUPER_ADMIN) {
        if (isMutation) {
          throw new AppError(
            'Super Admins cannot modify workspace contents without explicit Sector Secretary authorization.',
            403
          );
        }
        // Read-only inspection allowed for Super Admin
        req.workspaceId = rawWorkspaceId;
        req.membership = {
          role: WorkspaceRole.SPECTATOR,
          permissions: { canExportReports: false }
        };
        return next();
      }

      throw new AppError('Access denied: You are not an authorized member of this workspace.', 403);
    }

    // Member exists
    if (member.role === WorkspaceRole.SPECTATOR && isMutation) {
      throw new AppError('Spectator access is strictly read-only. Modification prohibited.', 403);
    }

    req.workspaceId = rawWorkspaceId;
    req.membership = {
      role: member.role,
      permissions: member.permissions
    };

    next();
  } catch (error) {
    next(error);
  }
};
