import { Request, Response, NextFunction } from 'express';
import { GmService } from './gm.service';

export class GmController {
  static async recordGroupMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const gm = await GmService.recordGroupMeeting(
        req.workspaceId!,
        req.body,
        req.user!.id
      );
      return res.status(201).json({ success: true, data: gm });
    } catch (error) {
      next(error);
    }
  }

  static async getGroupMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, startDate, endDate } = req.query;
      const meetings = await GmService.getGroupMeetings(req.workspaceId!, {
        unitId: unitId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      return res.status(200).json({ success: true, data: meetings });
    } catch (error) {
      next(error);
    }
  }

  static async updateGroupMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const gm = await GmService.updateGroupMeeting(
        req.workspaceId!,
        req.params.id,
        req.body,
        req.user!.id
      );
      return res.status(200).json({ success: true, data: gm });
    } catch (error) {
      next(error);
    }
  }

  static async deleteGroupMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GmService.deleteGroupMeeting(
        req.workspaceId!,
        req.params.id,
        req.user!.id
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getGmAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await GmService.getGmAnalytics(req.workspaceId!);
      return res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }
}
