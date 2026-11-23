import { Types } from 'mongoose';
import {
  WorkspaceSettingsModel,
  IWorkspaceSettingsDoc
} from '../workspaces/workspace.model';
import { PersonModel, IPersonDoc } from '../people/person.model';
import {
  IndividualMeetingModel,
  IIndividualMeetingDoc
} from '../meetings/meeting.model';
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
}
