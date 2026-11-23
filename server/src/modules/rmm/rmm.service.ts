import { Types } from 'mongoose';
import { RmmModel, RmmTargetModel, IRmmDoc } from './rmm.model';
import { IndividualMeetingModel } from '../meetings/meeting.model';
import { AuditLogModel } from '../audit/auditLog.model';
import { PersonStage } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class RmmService {
  static async createRmm(
    workspaceId: string,
    data: {
      unitId: string;
      rmmDate: string;
      weekStartDate: string;
      weekEndDate: string;
      plannedMaduMeetings?: number;
      plannedMdfMeetings?: number;
      comments?: string;
      targets?: Array<{
        personId: string;
        category: PersonStage;
        nextWeekTarget: number;
        expectedDay?: string;
      }>;
    },
    userId: string
  ) {
    const plannedMadu = data.plannedMaduMeetings || 0;
    const plannedMdf = data.plannedMdfMeetings || 0;

    const rmm = await RmmModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      unitId: new Types.ObjectId(data.unitId),
      rmmDate: new Date(data.rmmDate),
      weekStartDate: new Date(data.weekStartDate),
      weekEndDate: new Date(data.weekEndDate),
      plannedMaduMeetings: plannedMadu,
      plannedMdfMeetings: plannedMdf,
      comments: data.comments,
      createdById: new Types.ObjectId(userId)
    });

    if (data.targets && data.targets.length > 0) {
      for (const t of data.targets) {
        await RmmTargetModel.create({
          workspaceId: new Types.ObjectId(workspaceId),
          rmmId: rmm._id,
          personId: new Types.ObjectId(t.personId),
          category: t.category,
          nextWeekTarget: t.nextWeekTarget,
          expectedDay: t.expectedDay
        });
      }
    }

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'RMM_CREATED',
      entityType: 'Rmm',
      entityId: rmm._id,
      newState: {
        unitId: data.unitId,
        plannedMadu,
        plannedMdf,
        targetCount: data.targets?.length || 0
      }
    });

    return this.getRmmProgress(workspaceId, rmm._id.toString());
  }

  static async getRmmList(
    workspaceId: string,
    filters?: { unitId?: string; startDate?: string; endDate?: string }
  ) {
    const query: any = {
      workspaceId: new Types.ObjectId(workspaceId)
    };
    if (filters?.unitId) {
      query.unitId = new Types.ObjectId(filters.unitId);
    }
    if (filters?.startDate || filters?.endDate) {
      query.rmmDate = {};
      if (filters.startDate) query.rmmDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.rmmDate.$lte = new Date(filters.endDate);
    }

    return RmmModel.find(query)
      .populate('unitId', 'name code')
      .sort({ rmmDate: -1 });
  }

  static async getRmmProgress(workspaceId: string, rmmId: string) {
    const rmm = (await RmmModel.findOne({
      _id: new Types.ObjectId(rmmId),
      workspaceId: new Types.ObjectId(workspaceId)
    })
      .populate('unitId', 'name code')
      .exec()) as IRmmDoc | null;

    if (!rmm) {
      throw new AppError('RMM record not found', 404);
    }

    const startOfWeek = new Date(rmm.weekStartDate);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(rmm.weekEndDate);
    endOfWeek.setHours(23, 59, 59, 999);

    const targets = await RmmTargetModel.find({
      rmmId: rmm._id
    })
      .populate('personId', 'fullName internalId')
      .lean();

    // Query actual completed meetings in this week window for this unit
    const meetings = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      unitId: rmm.unitId,
      meetingDate: { $gte: startOfWeek, $lte: endOfWeek }
    }).lean();

    const personMeetingCount = new Map<string, number>();
    let actualMaduHeld = 0;
    let actualMdfHeld = 0;

    for (const m of meetings) {
      const pid = m.personId.toString();
      personMeetingCount.set(pid, (personMeetingCount.get(pid) || 0) + 1);
      if (m.personStageAtMeeting === PersonStage.MADU) {
        actualMaduHeld += 1;
      } else if (m.personStageAtMeeting === PersonStage.MDF) {
        actualMdfHeld += 1;
      }
    }

    let totalPlannedMadu = rmm.plannedMaduMeetings || 0;
    let totalPlannedMdf = rmm.plannedMdfMeetings || 0;
    let totalActualCompleted = meetings.length;

    const calculatedTargets = targets.map((t: any) => {
      const pid = t.personId?._id?.toString() || t.personId?.toString();
      const actualMeetings = personMeetingCount.get(pid) || 0;
      const plannedTarget = t.nextWeekTarget || 0;
      const remainingMeetings = Math.max(0, plannedTarget - actualMeetings);
      const completionPercentage =
        plannedTarget > 0
          ? Math.round((actualMeetings / plannedTarget) * 100)
          : actualMeetings > 0
          ? 100
          : 0;

      // Only accumulate from person rows if planned aggregate was 0
      if ((rmm.plannedMaduMeetings || 0) === 0 && t.category === PersonStage.MADU) {
        totalPlannedMadu += plannedTarget;
      } else if ((rmm.plannedMdfMeetings || 0) === 0 && t.category === PersonStage.MDF) {
        totalPlannedMdf += plannedTarget;
      }

      return {
        ...t,
        actualMeetings,
        remainingMeetings,
        completionPercentage
      };
    });

    const totalPlanned = totalPlannedMadu + totalPlannedMdf;
    const overallCompletionPercentage =
      totalPlanned > 0
        ? Math.round((totalActualCompleted / totalPlanned) * 100)
        : totalActualCompleted > 0
        ? 100
        : 0;

    return {
      rmm,
      summary: {
        totalPlanned,
        totalPlannedMadu,
        totalPlannedMdf,
        actualMaduHeld,
        actualMdfHeld,
        totalActualCompleted,
        totalRemaining: Math.max(0, totalPlanned - totalActualCompleted),
        overallCompletionPercentage
      },
      targets: calculatedTargets
    };
  }
}
