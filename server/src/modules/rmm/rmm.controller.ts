import { Request, Response, NextFunction } from 'express';
import { RmmService } from './rmm.service';
import { createRmmSchema } from '@dms/shared';

export class RmmController {
  static async createRmm(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createRmmSchema.parse(req.body);
      const result = await RmmService.createRmm(
        req.workspaceId!,
        validated,
        req.user!.id
      );
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRmmList(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, startDate, endDate } = req.query;
      const list = await RmmService.getRmmList(req.workspaceId!, {
        unitId: unitId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      return res.status(200).json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRmmProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await RmmService.getRmmProgress(
        req.workspaceId!,
        req.params.id
      );
      return res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRmm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RmmService.updateRmm(
        req.workspaceId!,
        req.params.id,
        req.body,
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

  static async deleteRmm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RmmService.deleteRmm(
        req.workspaceId!,
        req.params.id,
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
}
