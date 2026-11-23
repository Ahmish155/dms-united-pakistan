import { Request, Response, NextFunction } from 'express';
import { DfService } from './df.service';

export class DfController {
  static async createMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const mentor = await DfService.createMentor(req.workspaceId!, req.body);
      return res.status(201).json({ success: true, data: mentor });
    } catch (error) {
      next(error);
    }
  }

  static async getMentors(req: Request, res: Response, next: NextFunction) {
    try {
      const mentors = await DfService.getMentors(req.workspaceId!);
      return res.status(200).json({ success: true, data: mentors });
    } catch (error) {
      next(error);
    }
  }

  static async recordDialogueForum(req: Request, res: Response, next: NextFunction) {
    try {
      const df = await DfService.recordDialogueForum(
        req.workspaceId!,
        req.body,
        req.user!.id
      );
      return res.status(201).json({ success: true, data: df });
    } catch (error) {
      next(error);
    }
  }

  static async getDialogueForums(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, startDate, endDate } = req.query;
      const forums = await DfService.getDialogueForums(req.workspaceId!, {
        unitId: unitId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      return res.status(200).json({ success: true, data: forums });
    } catch (error) {
      next(error);
    }
  }

  static async getDfAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await DfService.getDfAnalytics(req.workspaceId!);
      return res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }
}
