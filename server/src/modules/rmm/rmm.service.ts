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
      comments?: string;
      targets: Array<{
        personId: string;
        category: PersonStage;
        nextWeekTarget: number;
        expectedDay?: string;
      }>;
    },
    userId: string
  ) {
    const rmm = await RmmModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      unitId: new Types.ObjectId(data.unitId),
      rmmDate: new Date(data.rmmDate),
      weekStartDate: new Date(data.weekStartDate),
      weekEndDate: new Date(data.weekEndDate),
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
      newState: { unitId: data.unitId, targetCount: data.targets?.length || 0 }
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

    // Query actual completed meetings in this week window
    const meetings = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      meetingDate: { $gte: startOfWeek, $lte: endOfWeek }
    }).lean();

    const personMeetingCount = new Map<string, number>();
    for (const m of meetings) {
      const pid = m.personId.toString();
      personMeetingCount.set(pid, (personMeetingCount.get(pid) || 0) + 1);
    }

    let totalPlannedMadu = 0;
    let totalPlannedMdf = 0;
    let totalActualCompleted = 0;

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

      if (t.category === PersonStage.MADU) {
        totalPlannedMadu += plannedTarget;
      } else if (t.category === PersonStage.MDF) {
        totalPlannedMdf += plannedTarget;
      }
      totalActualCompleted += actualMeetings;

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
        totalActualCompleted,
        totalRemaining: Math.max(0, totalPlanned - totalActualCompleted),
        overallCompletionPercentage
      },
      targets: calculatedTargets
    };
  }
}
