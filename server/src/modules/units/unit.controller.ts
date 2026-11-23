import { Request, Response, NextFunction } from 'express';
import { UnitService } from './unit.service';
import { createUnitSchema } from '@dms/shared';

export class UnitController {
  static async createUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createUnitSchema.parse(req.body);
      const unit = await UnitService.createUnit(
        req.workspaceId!,
        validated,
        req.user!.id
      );
      return res.status(201).json({
        success: true,
        data: unit
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnits(req: Request, res: Response, next: NextFunction) {
    try {
      const units = await UnitService.getUnits(req.workspaceId!);
      return res.status(200).json({
        success: true,
        data: units
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnitById(req: Request, res: Response, next: NextFunction) {
    try {
      const unit = await UnitService.getUnitById(req.workspaceId!, req.params.id);
      return res.status(200).json({
        success: true,
        data: unit
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const unit = await UnitService.updateUnit(
        req.workspaceId!,
        req.params.id,
        req.body,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: unit
      });
    } catch (error) {
      next(error);
    }
  }
}
