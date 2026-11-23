import { Request, Response, NextFunction } from 'express';
import { ActivityEngineService } from './activity.service';

export class ActivityController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await ActivityEngineService.getSectorActivityOverview(
        req.workspaceId!
      );
      return res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error) {
      next(error);
    }
  }
}
