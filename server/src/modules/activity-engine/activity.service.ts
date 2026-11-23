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
import {
  ActivityStatus,
  PersonStage,
  OrganizationalResponsibility,
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

    const people = await PersonModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isArchived: false
    });

    const maduList = people.filter((p) => p.currentStage === PersonStage.MADU);
    const mdfList = people.filter((p) => p.currentStage === PersonStage.MDF);
    const rabtakarList = people.filter(
      (p) =>
        p.currentStage === PersonStage.RABTAKAR ||
        p.roles.includes(OrganizationalResponsibility.RABTAKAR)
    );
    const daeenList = people.filter((p) =>
      p.roles.includes(OrganizationalResponsibility.DAEEN)
    );

    let activeMadu = 0;
    for (const m of maduList) {
      const s = await this.calculatePersonActivity(workspaceId, m, thresholds);
      if (s.status === ActivityStatus.ACTIVE) activeMadu++;
    }

    let activeMdf = 0;
    for (const m of mdfList) {
      const s = await this.calculatePersonActivity(workspaceId, m, thresholds);
      if (s.status === ActivityStatus.ACTIVE) activeMdf++;
    }

    let activeRabtakar = 0;
    for (const r of rabtakarList) {
      const s = await this.calculatePersonActivity(workspaceId, r, thresholds);
      if (s.status === ActivityStatus.ACTIVE) activeRabtakar++;
    }

    let activeDaeen = 0;
    for (const d of daeenList) {
      const s = await this.calculatePersonActivity(workspaceId, d, thresholds);
      if (s.status === ActivityStatus.ACTIVE) activeDaeen++;
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
    let startDate: Date;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'till_month_start') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else {
      // 'monthly': full current calendar month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    // 1. Fetch Units and People
    const units = await UnitModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isActive: true
    }).lean();

    const people = await PersonModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isArchived: false
    }).lean();

    // 2. Fetch Actual Meetings Held in this period
    const meetings = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      meetingDate: { $gte: startDate, $lte: endDate }
    }).lean();

    // 3. Expected Meetings calculation
    // From DMM for the current month/year or RMM weekly
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const dmm = (await DmmModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      month: currentMonth,
      year: currentYear
    }).lean().exec()) as any;

    let dmmTargets: any[] = [];
    if (dmm && dmm._id) {
      dmmTargets = await DmmTargetModel.find({
        workspaceId: new Types.ObjectId(workspaceId),
        dmmId: dmm._id
      }).lean();
    }

    // RMMs in period
    const rmms: any[] = await RmmModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      weekStartDate: { $gte: startDate, $lte: endDate }
    }).lean();

    // 4. Calculate Sector Level Active Counts
    const maduList: any[] = people.filter((p: any) => p.currentStage === PersonStage.MADU);
    const mdfList: any[] = people.filter((p: any) => p.currentStage === PersonStage.MDF);
    const rabtakarList: any[] = people.filter(
      (p: any) =>
        p.currentStage === PersonStage.RABTAKAR ||
        p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
    );
    const daeenList: any[] = people.filter((p: any) =>
      p.roles?.includes(OrganizationalResponsibility.DAEEN)
    );

    let activeMadu = 0;
    for (const m of maduList) {
      const s = await this.calculatePersonActivity(workspaceId, m as any, thresholds);
      if (s.status === ActivityStatus.ACTIVE) activeMadu++;
    }

    let activeMdf = 0;
    for (const m of mdfList) {
      const s = await this.calculatePersonActivity(workspaceId, m as any, thresholds);
      if (s.status === ActivityStatus.ACTIVE) activeMdf++;
    }

    let activeRabtakar = 0;
    for (const r of rabtakarList) {
      const s = await this.calculatePersonActivity(workspaceId, r as any, thresholds);
      if (s.status === ActivityStatus.ACTIVE) activeRabtakar++;
    }

    let activeDaeen = 0;
    for (const d of daeenList) {
      const s = await this.calculatePersonActivity(workspaceId, d as any, thresholds);
      if (s.status === ActivityStatus.ACTIVE) activeDaeen++;
    }

    // Sector Expected Meetings:
    // If weekly period, sum RMM planned meetings (or proportional DMM / 4)
    let totalSectorExpected = 0;
    if (period === 'weekly') {
      const rmmSum = rmms.reduce(
        (sum, r) => sum + (r.plannedMaduMeetings || 0) + (r.plannedMdfMeetings || 0),
        0
      );
      totalSectorExpected =
        rmmSum > 0
          ? rmmSum
          : Math.round(
              dmmTargets.reduce((sum, t) => sum + (t.targetMeetings || 0), 0) / 4
            );
    } else {
      totalSectorExpected = dmmTargets.reduce(
        (sum, t) => sum + (t.targetMeetings || 0),
        0
      );
      if (totalSectorExpected === 0 && rmms.length > 0) {
        totalSectorExpected = rmms.reduce(
          (sum, r) => sum + (r.plannedMaduMeetings || 0) + (r.plannedMdfMeetings || 0),
          0
        );
      }
    }

    const totalSectorHeld = meetings.length;

    // 5. Unit Breakdown
    // A Rabtakar can be part of multiple units / announcements, Madu belongs to a single unit.
    // Daeens do NOT belong to a unit and are explicitly EXCLUDED from unit breakdowns.
    const unitBreakdown = [];

    for (const unit of (units as any[])) {
      const unitIdStr = (unit._id as any).toString();

      // Unit Madu & MDF (belong to this unit)
      const unitMadu = maduList.filter(
        (m: any) => m.currentUnitId?.toString() === unitIdStr
      );
      const unitMdf = mdfList.filter(
        (m: any) => m.currentUnitId?.toString() === unitIdStr
      );

      // Unit Rabtakars: Primary unit or has Madu announced in this unit
      const unitRabtakar = rabtakarList.filter((r: any) => {
        if (r.currentUnitId?.toString() === unitIdStr) return true;
        // Check if has Madu in this unit
        return unitMadu.some(
          (m: any) => m.primaryRabtakarId?.toString() === (r._id as any).toString()
        );
      });

      let unitActiveMadu = 0;
      for (const m of unitMadu) {
        const s = await this.calculatePersonActivity(workspaceId, m as any, thresholds);
        if (s.status === ActivityStatus.ACTIVE) unitActiveMadu++;
      }

      let unitActiveMdf = 0;
      for (const m of unitMdf) {
        const s = await this.calculatePersonActivity(workspaceId, m as any, thresholds);
        if (s.status === ActivityStatus.ACTIVE) unitActiveMdf++;
      }

      let unitActiveRabtakar = 0;
      for (const r of unitRabtakar) {
        const s = await this.calculatePersonActivity(workspaceId, r as any, thresholds);
        if (s.status === ActivityStatus.ACTIVE) unitActiveRabtakar++;
      }

      // Expected meetings for this unit
      let unitExpected = 0;
      if (period === 'weekly') {
        const unitRmms = rmms.filter((r) => r.unitId.toString() === unitIdStr);
        const rmmSum = unitRmms.reduce(
          (sum, r) => sum + (r.plannedMaduMeetings || 0) + (r.plannedMdfMeetings || 0),
          0
        );
        const unitDmmTarget = dmmTargets
          .filter((t) => t.unitId.toString() === unitIdStr)
          .reduce((sum, t) => sum + (t.targetMeetings || 0), 0);
        unitExpected = rmmSum > 0 ? rmmSum : Math.round(unitDmmTarget / 4);
      } else {
        const unitDmmTarget = dmmTargets
          .filter((t) => t.unitId.toString() === unitIdStr)
          .reduce((sum, t) => sum + (t.targetMeetings || 0), 0);
        unitExpected = unitDmmTarget;
        if (unitExpected === 0) {
          const unitRmms = rmms.filter((r) => r.unitId.toString() === unitIdStr);
          unitExpected = unitRmms.reduce(
            (sum, r) => sum + (r.plannedMaduMeetings || 0) + (r.plannedMdfMeetings || 0),
            0
          );
        }
      }

      // Actual meetings held attributed to this unit
      const unitHeld = meetings.filter(
        (m) => m.unitId.toString() === unitIdStr
      ).length;

      unitBreakdown.push({
        unitId: unit._id,
        name: unit.name,
        code: unit.code,
        expectedMeetings: unitExpected,
        heldMeetings: unitHeld,
        completionRate:
          unitExpected > 0
            ? Math.round((unitHeld / unitExpected) * 100)
            : unitHeld > 0
            ? 100
            : 0,
        totalRabtakar: unitRabtakar.length,
        activeRabtakar: unitActiveRabtakar,
        totalMadu: unitMadu.length,
        activeMadu: unitActiveMadu,
        totalMdf: unitMdf.length,
        activeMdf: unitActiveMdf
        // Note: Daeens explicitly excluded from unit breakdown per organizational specification
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
        completionRate:
          totalSectorExpected > 0
            ? Math.round((totalSectorHeld / totalSectorExpected) * 100)
            : totalSectorHeld > 0
            ? 100
            : 0,
        activeRabtakar,
        totalRabtakar: rabtakarList.length,
        activeMadu,
        totalMadu: maduList.length,
        activeMdf,
        totalMdf: mdfList.length,
        activeDaeen,
        totalDaeen: daeenList.length
      },
      units: unitBreakdown
    };
  }
}
