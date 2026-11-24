import { Types } from 'mongoose';
import { DmmModel, DmmTargetModel, IDmmDoc } from './dmm.model';
import { IndividualMeetingModel } from '../meetings/meeting.model';
import { UnitModel } from '../units/unit.model';
import { AuditLogModel } from '../audit/auditLog.model';
import { DmmStatus, PersonStage } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class DmmService {
  static async createOrUpdateDmm(
    workspaceId: string,
    data: {
      month: number;
      year: number;
      status?: DmmStatus;
      expectedMscCount?: number;
      expectedMdfCount?: number;
      targets: Array<{
        unitId: string;
        personId: string;
        targetMeetings: number;
        rabtakarId: string;
        daeenId: string;
        category: PersonStage;
      }>;
    },
    userId: string
  ) {
    let dmm = await DmmModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      year: data.year,
      month: data.month,
      sessionStatus: 'ACTIVE'
    });

    if (!dmm) {
      // End any existing ACTIVE DMM for same workspace/month/year before creating new one
      await DmmModel.updateMany(
        {
          workspaceId: new Types.ObjectId(workspaceId),
          year: data.year,
          month: data.month,
          sessionStatus: 'ACTIVE'
        },
        { $set: { sessionStatus: 'ENDED' } }
      );

      dmm = await DmmModel.create({
        workspaceId: new Types.ObjectId(workspaceId),
        year: data.year,
        month: data.month,
        status: data.status || DmmStatus.DRAFT,
        sessionStatus: 'ACTIVE',
        expectedMscCount: data.expectedMscCount || 0,
        expectedMdfCount: data.expectedMdfCount || 0,
        createdById: new Types.ObjectId(userId)
      });
    } else {
      if (data.status) dmm.status = data.status;
      if (data.expectedMscCount !== undefined) dmm.expectedMscCount = data.expectedMscCount;
      if (data.expectedMdfCount !== undefined) dmm.expectedMdfCount = data.expectedMdfCount;
      await dmm.save();
    }

    // Upsert target entries
    if (data.targets && data.targets.length > 0) {
      for (const t of data.targets) {
        await DmmTargetModel.findOneAndUpdate(
          {
            dmmId: dmm._id,
            personId: new Types.ObjectId(t.personId)
          },
          {
            workspaceId: new Types.ObjectId(workspaceId),
            dmmId: dmm._id,
            unitId: new Types.ObjectId(t.unitId),
            personId: new Types.ObjectId(t.personId),
            category: t.category,
            targetMeetings: t.targetMeetings,
            rabtakarId: new Types.ObjectId(t.rabtakarId),
            daeenId: new Types.ObjectId(t.daeenId)
          },
          { upsert: true, new: true }
        );
      }
    }

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'DMM_SAVED',
      entityType: 'Dmm',
      entityId: dmm._id,
      newState: { month: data.month, year: data.year, targetCount: data.targets?.length || 0 }
    });

    return this.getDmmVariance(workspaceId, dmm._id.toString());
  }

  static async getDmms(workspaceId: string, year?: number) {
    const query: any = {
      workspaceId: new Types.ObjectId(workspaceId)
    };
    if (year) {
      query.year = year;
    }
    return DmmModel.find(query).sort({ year: -1, month: -1 });
  }

  static async getDmmVariance(workspaceId: string, dmmId: string) {
    const dmm = (await DmmModel.findOne({
      _id: new Types.ObjectId(dmmId),
      workspaceId: new Types.ObjectId(workspaceId)
    }).exec()) as IDmmDoc | null;

    if (!dmm) {
      throw new AppError('DMM record not found', 404);
    }

    // Month date boundaries
    const startOfMonth = new Date(dmm.year, dmm.month - 1, 1);
    const endOfMonth = new Date(dmm.year, dmm.month, 0, 23, 59, 59, 999);

    // Fetch all targets for this DMM
    const targets = await DmmTargetModel.find({
      dmmId: dmm._id
    })
      .populate('unitId', 'name code')
      .populate('personId', 'fullName internalId')
      .populate('rabtakarId', 'fullName')
      .populate('daeenId', 'fullName')
      .lean();

    // Fetch all actual completed meetings in this month
    const meetings = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      meetingDate: { $gte: startOfMonth, $lte: endOfMonth }
    }).lean();

    // Map meetings by personId
    const personMeetingCount = new Map<string, number>();
    for (const m of meetings) {
      const pid = m.personId.toString();
      personMeetingCount.set(pid, (personMeetingCount.get(pid) || 0) + 1);
    }

    // Calculate person-wise targets vs actual
    const calculatedTargets = targets.map((t: any) => {
      const pid = t.personId?._id?.toString() || t.personId?.toString();
      const actualMeetings = personMeetingCount.get(pid) || 0;
      const targetMeetings = t.targetMeetings || 0;
      const remainingMeetings = Math.max(0, targetMeetings - actualMeetings);
      const completionPercentage =
        targetMeetings > 0
          ? Math.round((actualMeetings / targetMeetings) * 100)
          : actualMeetings > 0
          ? 100
          : 0;

      return {
        ...t,
        actualMeetings,
        remainingMeetings,
        completionPercentage
      };
    });

    // Group by unit
    const unitMap = new Map<string, any>();
    for (const t of calculatedTargets) {
      const uid = t.unitId?._id?.toString() || t.unitId?.toString();
      const uName = t.unitId?.name || 'Unknown Unit';

      if (!unitMap.has(uid)) {
        unitMap.set(uid, {
          unitId: uid,
          unitName: uName,
          targets: [],
          totalTargetMeetings: 0,
          totalActualMeetings: 0,
          totalRemainingMeetings: 0,
          completionPercentage: 0
        });
      }

      const uGroup = unitMap.get(uid);
      uGroup.targets.push(t);
      uGroup.totalTargetMeetings += t.targetMeetings;
      uGroup.totalActualMeetings += t.actualMeetings;
      uGroup.totalRemainingMeetings += t.remainingMeetings;
    }

    // Compute unit completion rates
    const unitConclusions = Array.from(unitMap.values()).map((ug) => {
      ug.completionPercentage =
        ug.totalTargetMeetings > 0
          ? Math.round((ug.totalActualMeetings / ug.totalTargetMeetings) * 100)
          : ug.totalActualMeetings > 0
          ? 100
          : 0;
      return ug;
    });

    // Sector Totals
    const sectorTotalTarget = unitConclusions.reduce(
      (sum, u) => sum + u.totalTargetMeetings,
      0
    );
    const sectorTotalActual = unitConclusions.reduce(
      (sum, u) => sum + u.totalActualMeetings,
      0
    );
    const sectorTotalRemaining = Math.max(0, sectorTotalTarget - sectorTotalActual);
    const sectorCompletionPercentage =
      sectorTotalTarget > 0
        ? Math.round((sectorTotalActual / sectorTotalTarget) * 100)
        : sectorTotalActual > 0
        ? 100
        : 0;

    return {
      dmm,
      summary: {
        sectorTotalTarget,
        sectorTotalActual,
        sectorTotalRemaining,
        sectorCompletionPercentage,
        expectedMscCount: dmm.expectedMscCount,
        expectedMdfCount: dmm.expectedMdfCount
      },
      unitConclusions
    };
  }
}
