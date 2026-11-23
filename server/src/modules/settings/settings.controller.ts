import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { updateSettingsSchema } from '@dms/shared';

export class SettingsController {
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings(req.workspaceId!);
      return res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateSettingsSchema.parse(req.body);
      const updated = await SettingsService.updateSettings(
        req.workspaceId!,
        validated,
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
