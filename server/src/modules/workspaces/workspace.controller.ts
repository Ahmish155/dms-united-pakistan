import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from './workspace.service';
import { createWorkspaceSchema, AccessRequestStatus } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class WorkspaceController {
  static async createWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createWorkspaceSchema.parse(req.body);
      const workspace = await WorkspaceService.createWorkspace(
        req.user!.id,
        validated
      );
      return res.status(201).json({
        success: true,
        data: workspace
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaces = await WorkspaceService.getUserWorkspaces(req.user!.id);
      return res.status(200).json({
        success: true,
        data: workspaces
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWorkspaceDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await WorkspaceService.getWorkspaceDetails(req.workspaceId!);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateSpectatorLink(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await WorkspaceService.generateSpectatorInviteToken(
        req.workspaceId!,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestSpectatorAccess(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { workspaceId, token } = req.body;
      if (!workspaceId || !token) {
        throw new AppError('workspaceId and token are required', 400);
      }
      const request = await WorkspaceService.requestSpectatorAccess(
        workspaceId,
        req.user!.id,
        token
      );
      return res.status(201).json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAccessRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const requests = await WorkspaceService.getAccessRequests(
        req.workspaceId!
      );
      return res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  static async decideAccessRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (![AccessRequestStatus.APPROVED, AccessRequestStatus.REJECTED, AccessRequestStatus.REVOKED].includes(status)) {
        throw new AppError('Invalid status decision', 400);
      }
      const updated = await WorkspaceService.decideAccessRequest(
        req.workspaceId!,
        id,
        status,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
