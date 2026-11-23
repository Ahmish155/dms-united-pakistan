import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { WorkspaceRole } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class ReportController {
  static async getWeeklyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        throw new AppError('startDate and endDate are required', 400);
      }
      const report = await ReportService.getWeeklyReport(
        req.workspaceId!,
        startDate as string,
        endDate as string
      );
      return res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.query;
      const m = month ? parseInt(month as string, 10) : new Date().getMonth() + 1;
      const y = year ? parseInt(year as string, 10) : new Date().getFullYear();

      const report = await ReportService.getMonthlyReport(req.workspaceId!, m, y);
      return res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      // Spectator export check
      if (
        req.membership?.role === WorkspaceRole.SPECTATOR &&
        !req.membership?.permissions?.canExportReports
      ) {
        throw new AppError('Spectator report export permission is restricted by workspace settings', 403);
      }

      const { format } = req.params;
      const { startDate, endDate } = req.query;

      if (!['csv', 'doc', 'txt'].includes(format)) {
        throw new AppError('Supported formats: csv, doc, txt', 400);
      }
      if (!startDate || !endDate) {
        throw new AppError('startDate and endDate are required', 400);
      }

      const result = await ReportService.exportReport(
        req.workspaceId!,
        format as any,
        startDate as string,
        endDate as string
      );

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.content);
    } catch (error) {
      next(error);
    }
  }
}
