import { Request, Response, NextFunction } from 'express';
import { MeetingService } from './meeting.service';
import { recordMeetingSchema } from '@dms/shared';

export class MeetingController {
  static async recordMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = recordMeetingSchema.parse(req.body);
      const meeting = await MeetingService.recordMeeting(
        req.workspaceId!,
        {
          ...validated,
          allowDuplicate: req.body.allowDuplicate
        },
        req.user!.id
      );
      return res.status(201).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        unitId,
        personId,
        rabtakarId,
        primaryDaeenId,
        startDate,
        endDate
      } = req.query;

      const meetings = await MeetingService.getMeetings(req.workspaceId!, {
        unitId: unitId as string,
        personId: personId as string,
        rabtakarId: rabtakarId as string,
        primaryDaeenId: primaryDaeenId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });

      return res.status(200).json({
        success: true,
        data: meetings
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMeetingById(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await MeetingService.getMeetingById(
        req.workspaceId!,
        req.params.id
      );
      return res.status(200).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await MeetingService.updateMeeting(
        req.workspaceId!,
        req.params.id,
        req.body,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MeetingService.deleteMeeting(
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
