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

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as any) || 'monthly';
      const dashboard = await ActivityEngineService.getProgressDashboard(
        req.workspaceId!,
        period
      );
      return res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }
}
