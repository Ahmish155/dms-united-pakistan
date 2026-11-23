import { Request, Response, NextFunction } from 'express';
import { DmmService } from './dmm.service';
import { createDmmSchema } from '@dms/shared';

export class DmmController {
  static async saveDmm(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createDmmSchema.parse(req.body);
      const result = await DmmService.createOrUpdateDmm(
        req.workspaceId!,
        validated,
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

  static async getDmms(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const dmms = await DmmService.getDmms(req.workspaceId!, year);
      return res.status(200).json({
        success: true,
        data: dmms
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDmmVariance(req: Request, res: Response, next: NextFunction) {
    try {
      const variance = await DmmService.getDmmVariance(
        req.workspaceId!,
        req.params.id
      );
      return res.status(200).json({
        success: true,
        data: variance
      });
    } catch (error) {
      next(error);
    }
  }
}
