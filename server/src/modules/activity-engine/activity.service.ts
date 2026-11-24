import { Types } from 'mongoose';
import {
  WorkspaceSettingsModel,
  IWorkspaceSettingsDoc
} from '../workspaces/workspace.model';
import { PersonModel, IPersonDoc } from '../people/person.model';
import { UnitModel } from '../units/unit.model';
import {
  IndividualMeetingModel,
  IIndividualMeetingDoc
} from '../meetings/meeting.model';
import { DmmModel, DmmTargetModel } from '../dmm/dmm.model';
import { RmmModel } from '../rmm/rmm.model';
import { DialogueForumModel } from '../df/df.model';
import { GroupMeetingModel } from '../gm/gm.model';
import {
  ActivityStatus,
  PersonStage,
  OrganizationalResponsibility,
  OperationalStatus,
  DEFAULT_THRESHOLDS
} from '@dms/shared';

export interface CalculatedPersonStatus {
  personId: string;
  fullName: string;
  stage: PersonStage;
  status: ActivityStatus;
  lastMeetingDate: string | null;
  daysSinceLastMeeting: number | null;
  activeAssociatedMaduCount?: number;
  totalAssociatedMaduCount?: number;
}

export class ActivityEngineService {
  private static getDaysDifference(date: Date, now: Date = new Date()): number {
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  static async getWorkspaceThresholds(workspaceId: string) {
    const settings = (await WorkspaceSettingsModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId)
    }).exec()) as IWorkspaceSettingsDoc | null;

    return settings?.thresholds || DEFAULT_THRESHOLDS;
  }

  static async calculatePersonActivity(
    workspaceId: string,
    person: IPersonDoc,
    thresholds?: { maduDays: number; mdfDays: number; daeenDays: number }
  ): Promise<CalculatedPersonStatus> {
    const activeThresholds =
      thresholds || (await this.getWorkspaceThresholds(workspaceId));
    const now = new Date();

    const result: CalculatedPersonStatus = {
      personId: person._id.toString(),
      fullName: person.fullName,
      stage: person.currentStage,
      status: ActivityStatus.INACTIVE,
      lastMeetingDate: null,
      daysSinceLastMeeting: null
    };

    // 1. Madu calculation
    if (person.currentStage === PersonStage.MADU) {
      const lastMeeting = (await IndividualMeetingModel.findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        personId: person._id
      })
        .sort({ meetingDate: -1 })
        .exec()) as IIndividualMeetingDoc | null;

      if (lastMeeting) {
        const days = this.getDaysDifference(new Date(lastMeeting.meetingDate), now);
        result.lastMeetingDate = new Date(lastMeeting.meetingDate).toISOString();
        result.daysSinceLastMeeting = days;
        if (days <= activeThresholds.maduDays) {
          result.status = ActivityStatus.ACTIVE;
        }
      }
      return result;
    }

    // 2. MDF calculation
    if (person.currentStage === PersonStage.MDF) {
      const lastMeeting = (await IndividualMeetingModel.findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        personId: person._id
      })
        .sort({ meetingDate: -1 })
        .exec()) as IIndividualMeetingDoc | null;

      if (lastMeeting) {
        const days = this.getDaysDifference(new Date(lastMeeting.meetingDate), now);
        result.lastMeetingDate = new Date(lastMeeting.meetingDate).toISOString();
        result.daysSinceLastMeeting = days;
        if (days <= activeThresholds.mdfDays) {
          result.status = ActivityStatus.ACTIVE;
        }
      }
      return result;
    }

    // 3. Rabtakar calculation: Active if at least ONE associated Madu is active
    if (
      person.currentStage === PersonStage.RABTAKAR ||
      person.roles.includes(OrganizationalResponsibility.RABTAKAR)
    ) {
      const associatedMadu = await PersonModel.find({
        workspaceId: new Types.ObjectId(workspaceId),
        primaryRabtakarId: person._id,
        currentStage: PersonStage.MADU,
        isArchived: false
      });

      result.totalAssociatedMaduCount = associatedMadu.length;
      let activeCount = 0;

      for (const madu of associatedMadu) {
        const maduStatus = await this.calculatePersonActivity(
          workspaceId,
          madu,
          activeThresholds
        );
        if (maduStatus.status === ActivityStatus.ACTIVE) {
          activeCount++;
        }
      }

      result.activeAssociatedMaduCount = activeCount;
      if (activeCount > 0) {
        result.status = ActivityStatus.ACTIVE;
      }
      return result;
    }

    // 4. Daeen calculation: Active if conducted or participated in meeting within daeenDays
    if (person.roles.includes(OrganizationalResponsibility.DAEEN)) {
      const lastDaeenMeeting = (await IndividualMeetingModel.findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        $or: [
          { primaryDaeenId: person._id },
          { additionalDaeenIds: person._id }
        ]
      })
        .sort({ meetingDate: -1 })
        .exec()) as IIndividualMeetingDoc | null;

      if (lastDaeenMeeting) {
        const days = this.getDaysDifference(new Date(lastDaeenMeeting.meetingDate), now);
        result.lastMeetingDate = new Date(lastDaeenMeeting.meetingDate).toISOString();
        result.daysSinceLastMeeting = days;
        if (days <= activeThresholds.daeenDays) {
          result.status = ActivityStatus.ACTIVE;
        }
      }
      return result;
    }

    return result;
  }

  static async getSectorActivityOverview(workspaceId: string) {
    const thresholds = await this.getWorkspaceThresholds(workspaceId);
    const wId = new Types.ObjectId(workspaceId);

    const [people, meetings] = await Promise.all([
      PersonModel.find({ workspaceId: wId, isArchived: false }).lean(),
      IndividualMeetingModel.find({ workspaceId: wId }).sort({ meetingDate: -1 }).lean()
    ]);

    // Build quick lookup for latest meeting per person
    const latestMeetingPerPerson = new Map<string, Date>();
    const daeenMeetings = new Map<string, Date>();

    for (const m of meetings) {
      const pId = m.personId.toString();
      if (!latestMeetingPerPerson.has(pId)) {
        latestMeetingPerPerson.set(pId, new Date(m.meetingDate));
      }
      if (m.primaryDaeenId) {
        const dId = m.primaryDaeenId.toString();
        if (!daeenMeetings.has(dId)) daeenMeetings.set(dId, new Date(m.meetingDate));
      }
      if (m.additionalDaeenIds && Array.isArray(m.additionalDaeenIds)) {
        for (const addD of m.additionalDaeenIds) {
          const addDId = addD.toString();
          if (!daeenMeetings.has(addDId)) daeenMeetings.set(addDId, new Date(m.meetingDate));
        }
      }
    }

    const now = new Date();
    const maduList = people.filter((p: any) => p.currentStage === PersonStage.MADU);
    const mdfList = people.filter((p: any) => p.currentStage === PersonStage.MDF);
    const rabtakarList = people.filter(
      (p: any) =>
        p.currentStage === PersonStage.RABTAKAR ||
        p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
    );
    const daeenList = people.filter(
      (p: any) =>
        p.currentStage === PersonStage.DAEEN ||
        p.roles?.includes(OrganizationalResponsibility.DAEEN)
    );

    // Active Madu set
    const activeMaduIds = new Set<string>();
    let activeMadu = 0;
    for (const m of maduList) {
      const mDate = latestMeetingPerPerson.get((m._id as any).toString());
      if (mDate) {
        const diffDays = Math.floor(Math.abs(now.getTime() - mDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= thresholds.maduDays) {
          activeMadu++;
          activeMaduIds.add((m._id as any).toString());
        }
      }
    }

    // Active MDF
    let activeMdf = 0;
    for (const m of mdfList) {
      const mDate = latestMeetingPerPerson.get((m._id as any).toString());
      if (mDate) {
        const diffDays = Math.floor(Math.abs(now.getTime() - mDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= thresholds.mdfDays) {
          activeMdf++;
        }
      }
    }

    // Active Rabtakar: at least ONE assigned Madu is active
    let activeRabtakar = 0;
    for (const r of rabtakarList) {
      const rId = (r._id as any).toString();
      const hasActiveMadu = maduList.some(
        (m: any) => m.primaryRabtakarId?.toString() === rId && activeMaduIds.has((m._id as any).toString())
      );
      if (hasActiveMadu) {
        activeRabtakar++;
      }
    }

    // Active Daeen: conducted a meeting within daeenDays
    let activeDaeen = 0;
    for (const d of daeenList) {
      const dId = (d._id as any).toString();
      const dDate = daeenMeetings.get(dId);
      if (dDate) {
        const diffDays = Math.floor(Math.abs(now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= thresholds.daeenDays) {
          activeDaeen++;
        }
      }
    }

    return {
      thresholds,
      counts: {
        totalMadu: maduList.length,
        activeMadu,
        inactiveMadu: maduList.length - activeMadu,
        totalMdf: mdfList.length,
        activeMdf,
        inactiveMdf: mdfList.length - activeMdf,
        totalRabtakar: rabtakarList.length,
        activeRabtakar,
        inactiveRabtakar: rabtakarList.length - activeRabtakar,
        totalDaeen: daeenList.length,
        activeDaeen,
        inactiveDaeen: daeenList.length - activeDaeen
      }
    };
  }

  static async getProgressDashboard(
    workspaceId: string,
    period: 'weekly' | 'monthly' | 'till_month_start' = 'monthly'
  ) {
    const thresholds = await this.getWorkspaceThresholds(workspaceId);
    const now = new Date();
    const wId = new Types.ObjectId(workspaceId);
    let startDate: Date;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 'monthly' or 'till_month_start': full current calendar month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    // 1. Fetch Units and People
    const [units, people, periodMeetings, allMeetings, periodDfs, periodGms, periodRmms] = await Promise.all([
      UnitModel.find({ workspaceId: wId, isActive: true }).lean(),
      PersonModel.find({ workspaceId: wId, isArchived: false }).lean(),
      IndividualMeetingModel.find({
        workspaceId: wId,
        meetingDate: { $gte: startDate, $lte: endDate }
      }).lean(),
      IndividualMeetingModel.find({ workspaceId: wId })
        .select('personId meetingDate primaryDaeenId additionalDaeenIds rabtakarId')
        .sort({ meetingDate: -1 })
        .lean(),
      DialogueForumModel.find({
        workspaceId: wId,
        date: { $gte: startDate, $lte: endDate }
      }).lean(),
      GroupMeetingModel.find({
        workspaceId: wId,
        date: { $gte: startDate, $lte: endDate }
      }).lean(),
      RmmModel.find({
        workspaceId: wId,
        weekStartDate: { $gte: startDate, $lte: endDate }
      }).lean()
    ]);

    // 2. Expected Meetings calculation
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const dmm = (await DmmModel.findOne({
      workspaceId: wId,
      month: currentMonth,
      year: currentYear,
      sessionStatus: 'ACTIVE'
    }).lean().exec()) as any;

    let dmmTargets: any[] = [];
    if (dmm && dmm._id) {
      dmmTargets = await DmmTargetModel.find({
        workspaceId: wId,
        dmmId: dmm._id
      }).lean();
    }

    // 3. Separate Target Accounting
    let totalSectorExpected = 0;
    if (period === 'weekly') {
      // Weekly targets strictly from active RMMs in this period
      totalSectorExpected = periodRmms.reduce(
        (sum, r: any) => sum + (r.plannedMaduMeetings || 0) + (r.plannedMdfMeetings || 0),
        0
      );
    } else {
      // Monthly targets strictly from DMM
      totalSectorExpected = dmmTargets.reduce(
        (sum, t: any) => sum + (t.targetMeetings || 0),
        0
      );
      if (totalSectorExpected === 0 && dmm) {
        totalSectorExpected = (dmm.expectedMscCount || 0) + (dmm.expectedMdfCount || 0);
      }
    }

    const totalSectorHeld = periodMeetings.length;

    // 4. Precompute Activity Status based on all meetings and thresholds
    const latestMeetingPerPerson = new Map<string, { date: Date; days: number }>();
    const daeenMeetings = new Map<string, Date>();
    for (const m of allMeetings) {
      const pId = m.personId ? m.personId.toString() : '';
      const mDate = new Date(m.meetingDate);
      if (pId && !latestMeetingPerPerson.has(pId)) {
        const days = Math.floor(Math.abs(now.getTime() - mDate.getTime()) / (1000 * 60 * 60 * 24));
        latestMeetingPerPerson.set(pId, { date: mDate, days });
      }
      if (m.primaryDaeenId) {
        const dId = m.primaryDaeenId.toString();
        if (!daeenMeetings.has(dId)) daeenMeetings.set(dId, mDate);
      }
      if (m.additionalDaeenIds && Array.isArray(m.additionalDaeenIds)) {
        for (const addD of m.additionalDaeenIds) {
          const addDId = addD.toString();
          if (!daeenMeetings.has(addDId)) daeenMeetings.set(addDId, mDate);
        }
      }
    }

    // Classify People
    const maduList: any[] = people.filter((p: any) => p.currentStage === PersonStage.MADU);
    const mdfList: any[] = people.filter((p: any) => p.currentStage === PersonStage.MDF);
    const rabtakarList: any[] = people.filter(
      (p: any) =>
        p.currentStage === PersonStage.RABTAKAR ||
        p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
    );
    const daeenList: any[] = people.filter(
      (p: any) =>
        p.currentStage === PersonStage.DAEEN ||
        p.roles?.includes(OrganizationalResponsibility.DAEEN)
    );

    // Madu Status Breakdown
    let activeMadu = 0;
    let inactiveMadu = 0;
    let pipelineMadu = 0;
    let freezedMadu = 0;
    let droppedMadu = 0;
    const activeMaduIds = new Set<string>();

    for (const m of maduList) {
      const pId = (m._id as any).toString();
      const opStatus = m.operationalStatus;
      if (opStatus === OperationalStatus.FREEZED) {
        freezedMadu++;
      } else if (opStatus === OperationalStatus.DROPPED) {
        droppedMadu++;
      } else if (opStatus === OperationalStatus.PIPELINE) {
        pipelineMadu++;
      } else {
        const meet = latestMeetingPerPerson.get(pId);
        if (meet && meet.days <= thresholds.maduDays) {
          activeMadu++;
          activeMaduIds.add(pId);
        } else {
          inactiveMadu++;
        }
      }
    }

    // MDF Status Breakdown
    let activeMdf = 0;
    let inactiveMdf = 0;
    let freezedMdf = 0;
    let droppedMdf = 0;

    for (const m of mdfList) {
      const pId = (m._id as any).toString();
      const opStatus = m.operationalStatus;
      if (opStatus === OperationalStatus.FREEZED) {
        freezedMdf++;
      } else if (opStatus === OperationalStatus.DROPPED) {
        droppedMdf++;
      } else {
        const meet = latestMeetingPerPerson.get(pId);
        if (meet && meet.days <= thresholds.mdfDays) {
          activeMdf++;
        } else {
          inactiveMdf++;
        }
      }
    }

    // Rabtakar Status Breakdown
    let activeRabtakar = 0;
    let inactiveRabtakar = 0;
    for (const r of rabtakarList) {
      const rId = (r._id as any).toString();
      const hasActiveMadu = maduList.some(
        (m: any) => m.primaryRabtakarId?.toString() === rId && activeMaduIds.has((m._id as any).toString())
      );
      if (hasActiveMadu) {
        activeRabtakar++;
      } else {
        inactiveRabtakar++;
      }
    }

    // Daeen Status Breakdown
    let activeDaeen = 0;
    let inactiveDaeen = 0;
    for (const d of daeenList) {
      const dId = (d._id as any).toString();
      const dDate = daeenMeetings.get(dId);
      if (dDate) {
        const diffDays = Math.floor(Math.abs(now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= thresholds.daeenDays) {
          activeDaeen++;
        } else {
          inactiveDaeen++;
        }
      } else {
        inactiveDaeen++;
      }
    }

    // 5. Unit Breakdown
    const unitBreakdown = [];
    for (const unit of (units as any[])) {
      const unitIdStr = (unit._id as any).toString();

      const unitMadu = maduList.filter(
        (m: any) => m.currentUnitId?.toString() === unitIdStr
      );
      const unitMdf = mdfList.filter(
        (m: any) => m.currentUnitId?.toString() === unitIdStr
      );
      const unitRabtakar = rabtakarList.filter((r: any) => {
        if (r.currentUnitId?.toString() === unitIdStr) return true;
        if (r.assignedUnitIds?.some((u: any) => u.toString() === unitIdStr)) return true;
        return unitMadu.some(
          (m: any) => m.primaryRabtakarId?.toString() === (r._id as any).toString()
        );
      });

      let unitActiveMadu = 0;
      let unitInactiveMadu = 0;
      let unitPipelineMadu = 0;
      let unitFreezedMadu = 0;
      let unitDroppedMadu = 0;

      for (const m of unitMadu) {
        const pId = (m._id as any).toString();
        const opStatus = m.operationalStatus;
        if (opStatus === OperationalStatus.FREEZED) unitFreezedMadu++;
        else if (opStatus === OperationalStatus.DROPPED) unitDroppedMadu++;
        else if (opStatus === OperationalStatus.PIPELINE) unitPipelineMadu++;
        else if (activeMaduIds.has(pId)) unitActiveMadu++;
        else unitInactiveMadu++;
      }

      let unitActiveMdf = 0;
      let unitInactiveMdf = 0;
      for (const m of unitMdf) {
        const pId = (m._id as any).toString();
        const meet = latestMeetingPerPerson.get(pId);
        if (meet && meet.days <= thresholds.mdfDays) unitActiveMdf++;
        else unitInactiveMdf++;
      }

      let unitActiveRabtakar = 0;
      for (const r of unitRabtakar) {
        const rId = (r._id as any).toString();
        const hasActiveMaduInUnit = unitMadu.some(
          (m: any) => m.primaryRabtakarId?.toString() === rId && activeMaduIds.has((m._id as any).toString())
        );
        if (hasActiveMaduInUnit) unitActiveRabtakar++;
      }

      // Expected meetings for this unit
      let unitExpected = 0;
      if (period === 'weekly') {
        const unitRmms = periodRmms.filter((r: any) => r.unitId?.toString() === unitIdStr);
        unitExpected = unitRmms.reduce(
          (sum: number, r: any) => sum + (r.plannedMaduMeetings || 0) + (r.plannedMdfMeetings || 0),
          0
        );
      } else {
        unitExpected = dmmTargets
          .filter((t: any) => t.unitId?.toString() === unitIdStr)
          .reduce((sum: number, t: any) => sum + (t.targetMeetings || 0), 0);
      }

      // Counts held in period for this unit
      const unitHeld = periodMeetings.filter(
        (m: any) => m.unitId?.toString() === unitIdStr
      ).length;
      const unitDfHeld = periodDfs.filter(
        (df: any) => df.unitId?.toString() === unitIdStr
      ).length;
      const unitGmHeld = periodGms.filter(
        (gm: any) => gm.unitId?.toString() === unitIdStr
      ).length;
      const unitRmmHeld = periodRmms.filter(
        (rmm: any) => rmm.unitId?.toString() === unitIdStr
      ).length;

      unitBreakdown.push({
        unitId: unit._id,
        name: unit.name,
        code: unit.code,
        expectedMeetings: unitExpected,
        heldMeetings: unitHeld,
        dfHeld: unitDfHeld,
        gmHeld: unitGmHeld,
        rmmHeld: unitRmmHeld,
        completionRate:
          unitExpected > 0
            ? Math.round((unitHeld / unitExpected) * 100)
            : unitHeld > 0
            ? 100
            : 0,
        totalRabtakar: unitRabtakar.length,
        activeRabtakar: unitActiveRabtakar,
        inactiveRabtakar: unitRabtakar.length - unitActiveRabtakar,
        totalMadu: unitMadu.length,
        activeMadu: unitActiveMadu,
        inactiveMadu: unitInactiveMadu,
        pipelineMadu: unitPipelineMadu,
        freezedMadu: unitFreezedMadu,
        droppedMadu: unitDroppedMadu,
        totalMdf: unitMdf.length,
        activeMdf: unitActiveMdf,
        inactiveMdf: unitInactiveMdf
      });
    }

    return {
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      sector: {
        expectedMeetings: totalSectorExpected,
        heldMeetings: totalSectorHeld,
        totalImHeld: periodMeetings.length,
        totalDfHeld: periodDfs.length,
        totalGmHeld: periodGms.length,
        totalRmmHeld: periodRmms.length,
        completionRate:
          totalSectorExpected > 0
            ? Math.round((totalSectorHeld / totalSectorExpected) * 100)
            : totalSectorHeld > 0
            ? 100
            : 0,
        activeRabtakar,
        inactiveRabtakar,
        totalRabtakar: rabtakarList.length,
        activeMadu,
        inactiveMadu,
        pipelineMadu,
        freezedMadu,
        droppedMadu,
        totalMadu: maduList.length,
        activeMdf,
        inactiveMdf,
        freezedMdf,
        droppedMdf,
        totalMdf: mdfList.length,
        activeDaeen,
        inactiveDaeen,
        totalDaeen: daeenList.length
      },
      units: unitBreakdown
    };
  }
}
