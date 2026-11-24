import { Types } from 'mongoose';
import {
  PersonModel,
  IPersonDoc,
  PromotionHistoryModel,
  UnitAssignmentHistoryModel
} from './person.model';
import { UnitModel } from '../units/unit.model';
import { IndividualMeetingModel } from '../meetings/meeting.model';
import { DfAttendanceModel } from '../df/df.model';
import { ActivityEngineService } from '../activity-engine/activity.service';
import { AuditLogModel } from '../audit/auditLog.model';
import {
  PersonStage,
  OrganizationalResponsibility,
  ActivityStatus,
  OperationalStatus
} from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class PersonService {
  private static async generateInternalId(workspaceId: string): Promise<string> {
    const count = await PersonModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId)
    });
    return `UP-${(count + 1).toString().padStart(4, '0')}`;
  }

  static async createPerson(
    workspaceId: string,
    data: {
      fullName: string;
      contactNumber?: string;
      currentUnitId?: string | null;
      assignedUnitIds?: string[];
      currentStage: PersonStage;
      roles?: OrganizationalResponsibility[];
      primaryRabtakarId?: string;
      defaultDaeenId?: string;
      notes?: string;
      operationalStatus?: OperationalStatus;
    },
    userId: string
  ) {
    const isDaeen = data.currentStage === PersonStage.DAEEN || data.roles?.includes(OrganizationalResponsibility.DAEEN);

    let unitId: Types.ObjectId | undefined = undefined;
    if (data.currentUnitId) {
      const unit = await UnitModel.findOne({
        _id: new Types.ObjectId(data.currentUnitId),
        workspaceId: new Types.ObjectId(workspaceId),
        isActive: true
      });
      if (unit) {
        unitId = unit._id;
      }
    } else if (!isDaeen) {
      // If not Daeen and no unit specified, try to find any active unit in sector
      const firstUnit = await UnitModel.findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        isActive: true
      });
      if (firstUnit) {
        unitId = firstUnit._id;
      }
    }

    const assignedUnits: Types.ObjectId[] = [];
    if (data.assignedUnitIds && Array.isArray(data.assignedUnitIds)) {
      for (const u of data.assignedUnitIds) {
        if (Types.ObjectId.isValid(u)) assignedUnits.push(new Types.ObjectId(u));
      }
    }
    if (unitId && !assignedUnits.some((id) => id.equals(unitId))) {
      assignedUnits.push(unitId);
    }

    const internalId = await this.generateInternalId(workspaceId);

    const person = await PersonModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      internalId,
      fullName: data.fullName,
      contactNumber: data.contactNumber,
      currentUnitId: unitId,
      assignedUnitIds: assignedUnits,
      currentStage: data.currentStage || PersonStage.MADU,
      roles: data.roles || [],
      primaryRabtakarId: data.primaryRabtakarId
        ? new Types.ObjectId(data.primaryRabtakarId)
        : undefined,
      defaultDaeenId: data.defaultDaeenId
        ? new Types.ObjectId(data.defaultDaeenId)
        : undefined,
      notes: data.notes,
      operationalStatus: data.operationalStatus || OperationalStatus.ACTIVE,
      isArchived: false
    });

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'PERSON_CREATED',
      entityType: 'Person',
      entityId: person._id,
      newState: person.toObject()
    });

    return person;
  }

  static async getPeople(
    workspaceId: string,
    filters?: {
      unitId?: string;
      stage?: PersonStage;
      role?: OrganizationalResponsibility;
      search?: string;
    }
  ) {
    const query: any = {
      workspaceId: new Types.ObjectId(workspaceId),
      isArchived: false
    };

    if (filters?.unitId) {
      query.currentUnitId = new Types.ObjectId(filters.unitId);
    }
    if (filters?.stage) {
      query.currentStage = filters.stage;
    }
    if (filters?.role) {
      query.roles = filters.role;
    }
    if (filters?.search) {
      query.fullName = { $regex: filters.search, $options: 'i' };
    }

    const people = await PersonModel.find(query)
      .populate('currentUnitId', 'name code')
      .populate('primaryRabtakarId', 'fullName internalId')
      .populate('defaultDaeenId', 'fullName internalId')
      .sort({ fullName: 1 })
      .lean();

    const thresholds = await ActivityEngineService.getWorkspaceThresholds(workspaceId);

    // Fast Batch Processing: Load all meetings in ONE query instead of N+1
    const allMeetings = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId)
    })
      .select('personId meetingDate primaryDaeenId additionalDaeenIds rabtakarId')
      .sort({ meetingDate: -1 })
      .lean();

    const now = new Date();
    const latestMeetingPerPerson = new Map<string, { date: Date; days: number }>();
    const daeenMeetings = new Map<string, Date>();
    const daeenMeetingCount = new Map<string, number>();
    const rabtakarMeetingCount = new Map<string, number>();

    for (const m of allMeetings) {
      const pId = m.personId ? m.personId.toString() : '';
      const mDate = new Date(m.meetingDate);

      if (pId && !latestMeetingPerPerson.has(pId)) {
        const days = Math.floor(Math.abs(now.getTime() - mDate.getTime()) / (1000 * 60 * 60 * 24));
        latestMeetingPerPerson.set(pId, { date: mDate, days });
      }

      if (m.primaryDaeenId) {
        const dId = m.primaryDaeenId.toString();
        daeenMeetingCount.set(dId, (daeenMeetingCount.get(dId) || 0) + 1);
        if (!daeenMeetings.has(dId)) daeenMeetings.set(dId, mDate);
      }
      if (m.additionalDaeenIds && Array.isArray(m.additionalDaeenIds)) {
        for (const addD of m.additionalDaeenIds) {
          const addDId = addD.toString();
          daeenMeetingCount.set(addDId, (daeenMeetingCount.get(addDId) || 0) + 1);
          if (!daeenMeetings.has(addDId)) daeenMeetings.set(addDId, mDate);
        }
      }

      if (m.rabtakarId) {
        const rId = m.rabtakarId.toString();
        rabtakarMeetingCount.set(rId, (rabtakarMeetingCount.get(rId) || 0) + 1);
      }
    }

    // Map active Madu by Rabtakar
    const maduList = people.filter((p: any) => p.currentStage === PersonStage.MADU);
    const rabtakarMaduStats = new Map<string, { total: number; active: number }>();

    for (const m of maduList) {
      const rId = m.primaryRabtakarId?._id?.toString() || m.primaryRabtakarId?.toString();
      if (rId) {
        const stats = rabtakarMaduStats.get(rId) || { total: 0, active: 0 };
        stats.total++;
        const meet = latestMeetingPerPerson.get((m as any)._id.toString());
        if (meet && meet.days <= thresholds.maduDays) {
          stats.active++;
        }
        rabtakarMaduStats.set(rId, stats);
      }
    }

    // Decorate people in memory in < 1ms
    const decoratedPeople = people.map((p: any) => {
      const pId = (p as any)._id.toString();
      let activityStatus = ActivityStatus.INACTIVE;
      let daysSinceLastMeeting: number | null = null;
      let lastMeetingDate: string | null = null;
      let activeAssociatedMaduCount = 0;
      let totalAssociatedMaduCount = 0;
      let totalMeetingsConducted = 0;

      // Check operational status override
      if (p.operationalStatus === OperationalStatus.FREEZED) {
        activityStatus = ActivityStatus.INACTIVE;
      } else if (p.operationalStatus === OperationalStatus.DROPPED) {
        activityStatus = ActivityStatus.INACTIVE;
      } else if (p.operationalStatus === OperationalStatus.PIPELINE) {
        activityStatus = ActivityStatus.INACTIVE;
      } else if (p.currentStage === PersonStage.MADU) {
        const meet = latestMeetingPerPerson.get(pId);
        if (meet) {
          lastMeetingDate = meet.date.toISOString();
          daysSinceLastMeeting = meet.days;
          if (meet.days <= thresholds.maduDays) activityStatus = ActivityStatus.ACTIVE;
        }
      } else if (p.currentStage === PersonStage.MDF) {
        const meet = latestMeetingPerPerson.get(pId);
        if (meet) {
          lastMeetingDate = meet.date.toISOString();
          daysSinceLastMeeting = meet.days;
          if (meet.days <= thresholds.mdfDays) activityStatus = ActivityStatus.ACTIVE;
        }
      } else if (
        p.currentStage === PersonStage.RABTAKAR ||
        p.roles?.includes(OrganizationalResponsibility.RABTAKAR)
      ) {
        const rStats = rabtakarMaduStats.get(pId) || { total: 0, active: 0 };
        totalAssociatedMaduCount = rStats.total;
        activeAssociatedMaduCount = rStats.active;
        totalMeetingsConducted = rabtakarMeetingCount.get(pId) || 0;
        if (activeAssociatedMaduCount > 0) activityStatus = ActivityStatus.ACTIVE;
      } else if (
        p.currentStage === PersonStage.DAEEN ||
        p.roles?.includes(OrganizationalResponsibility.DAEEN)
      ) {
        totalMeetingsConducted = daeenMeetingCount.get(pId) || 0;
        const dDate = daeenMeetings.get(pId);
        if (dDate) {
          const days = Math.floor(Math.abs(now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24));
          lastMeetingDate = dDate.toISOString();
          daysSinceLastMeeting = days;
          if (days <= thresholds.daeenDays) activityStatus = ActivityStatus.ACTIVE;
        }
      }

      return {
        ...p,
        activityStatus,
        daysSinceLastMeeting,
        lastMeetingDate,
        activeAssociatedMaduCount,
        totalAssociatedMaduCount,
        totalMeetingsConducted
      };
    });

    return decoratedPeople;
  }

  static async getPersonById(workspaceId: string, id: string) {
    const person = (await PersonModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    })
      .populate('currentUnitId', 'name code')
      .populate('primaryRabtakarId', 'fullName internalId')
      .populate('defaultDaeenId', 'fullName internalId')
      .exec()) as IPersonDoc | null;

    if (!person) {
      throw new AppError('Person not found', 404);
    }

    const thresholds = await ActivityEngineService.getWorkspaceThresholds(workspaceId);
    const activity = await ActivityEngineService.calculatePersonActivity(
      workspaceId,
      person,
      thresholds
    );

    // Load meeting history as attendee/Madu
    const meetings = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      personId: person._id
    })
      .populate('unitId', 'name code')
      .populate('rabtakarId', 'fullName')
      .populate('primaryDaeenId', 'fullName')
      .populate('additionalDaeenIds', 'fullName')
      .sort({ meetingDate: -1 });

    // Load meetings conducted as Daeen
    const meetingsAsDaeen = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      $or: [
        { primaryDaeenId: person._id },
        { additionalDaeenIds: person._id }
      ]
    })
      .populate('personId', 'fullName currentStage internalId')
      .populate('unitId', 'name code')
      .populate('rabtakarId', 'fullName')
      .sort({ meetingDate: -1 });

    // Load meetings where they were Rabtakar
    const meetingsAsRabtakar = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      rabtakarId: person._id
    })
      .populate('personId', 'fullName currentStage internalId')
      .populate('unitId', 'name code')
      .populate('primaryDaeenId', 'fullName')
      .sort({ meetingDate: -1 });

    // If person is MDF, fetch DF attendance history & latest DF date
    let dfAttendanceHistory: any[] = [];
    let lastAttendedDfDate: string | null = null;
    if (person.currentStage === PersonStage.MDF) {
      dfAttendanceHistory = await DfAttendanceModel.find({
        workspaceId: new Types.ObjectId(workspaceId),
        personId: person._id,
        status: 'ATTENDED'
      })
        .populate({
          path: 'dfId',
          populate: [{ path: 'unitId', select: 'name' }, { path: 'mentorId', select: 'name' }]
        })
        .lean();

      if (dfAttendanceHistory.length > 0 && dfAttendanceHistory[0].dfId) {
        lastAttendedDfDate = new Date((dfAttendanceHistory[0].dfId as any).date).toISOString();
      }
    }

    // Load promotion history
    const promotions = await PromotionHistoryModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      personId: person._id
    })
      .populate('promotedBy', 'name')
      .sort({ promotedAt: -1 });

    // Load unit transfer history
    const transfers = await UnitAssignmentHistoryModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      personId: person._id
    })
      .populate('fromUnitId', 'name')
      .populate('toUnitId', 'name')
      .populate('transferredBy', 'name')
      .sort({ transferredAt: -1 });

    // If person is Rabtakar, find all Madu/MDF provided by them with pipeline & active status
    let associatedMadu: any[] = [];
    if (
      person.currentStage === PersonStage.RABTAKAR ||
      person.roles.includes(OrganizationalResponsibility.RABTAKAR)
    ) {
      associatedMadu = await PersonModel.find({
        workspaceId: new Types.ObjectId(workspaceId),
        primaryRabtakarId: person._id,
        isArchived: false
      })
        .populate('currentUnitId', 'name')
        .populate('defaultDaeenId', 'fullName')
        .lean();
    }

    // If person is Daeen, find all Madu/MDF assigned or met with them
    let daeenAssociatedMadu: any[] = [];
    if (
      person.currentStage === PersonStage.DAEEN ||
      person.roles.includes(OrganizationalResponsibility.DAEEN)
    ) {
      // Find Madu where defaultDaeenId is this person
      daeenAssociatedMadu = await PersonModel.find({
        workspaceId: new Types.ObjectId(workspaceId),
        defaultDaeenId: person._id,
        isArchived: false
      })
        .populate('currentUnitId', 'name')
        .populate('primaryRabtakarId', 'fullName')
        .lean();
    }

    // Determine clear last IM date
    const lastImDate = meetings.length > 0 ? new Date(meetings[0].meetingDate).toISOString() : null;

    return {
      person,
      activity: {
        ...activity,
        lastImDate,
        lastAttendedDfDate,
        totalMeetingsAsDaeen: meetingsAsDaeen.length,
        totalMeetingsAsRabtakar: meetingsAsRabtakar.length
      },
      meetings,
      meetingsAsDaeen,
      meetingsAsRabtakar,
      dfAttendanceHistory,
      promotions,
      transfers,
      associatedMadu,
      daeenAssociatedMadu
    };
  }

  static async updatePerson(
    workspaceId: string,
    id: string,
    data: any,
    userId: string
  ) {
    const person = await PersonModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!person) {
      throw new AppError('Person not found', 404);
    }

    const previousState = person.toObject();

    if (data.fullName) person.fullName = data.fullName;
    if (data.contactNumber !== undefined) person.contactNumber = data.contactNumber;
    if (data.currentStage) person.currentStage = data.currentStage;
    if (data.currentUnitId !== undefined) {
      person.currentUnitId = data.currentUnitId ? new Types.ObjectId(data.currentUnitId) : undefined;
    }
    if (data.assignedUnitIds !== undefined && Array.isArray(data.assignedUnitIds)) {
      person.assignedUnitIds = data.assignedUnitIds
        .filter((id: string) => Types.ObjectId.isValid(id))
        .map((id: string) => new Types.ObjectId(id));
    }
    if (data.roles) person.roles = data.roles;
    if (data.primaryRabtakarId !== undefined) {
      person.primaryRabtakarId = data.primaryRabtakarId
        ? new Types.ObjectId(data.primaryRabtakarId)
        : undefined;
    }
    if (data.defaultDaeenId !== undefined) {
      person.defaultDaeenId = data.defaultDaeenId
        ? new Types.ObjectId(data.defaultDaeenId)
        : undefined;
    }
    if (data.notes !== undefined) person.notes = data.notes;
    if (data.operationalStatus) person.operationalStatus = data.operationalStatus;

    await person.save();

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'PERSON_UPDATED',
      entityType: 'Person',
      entityId: person._id,
      previousState,
      newState: person.toObject()
    });

    return person;
  }

  static async deletePerson(workspaceId: string, id: string, userId: string) {
    const person = await PersonModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!person) {
      throw new AppError('Person not found', 404);
    }

    const previousState = person.toObject();
    person.isArchived = true;
    await person.save();

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'PERSON_DELETED',
      entityType: 'Person',
      entityId: person._id,
      previousState
    });

    return { message: 'Person deleted successfully' };
  }

  static async promotePerson(
    workspaceId: string,
    id: string,
    toStage: PersonStage,
    remarks: string,
    userId: string
  ) {
    const person = await PersonModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!person) {
      throw new AppError('Person not found', 404);
    }

    const fromStage = person.currentStage;

    if (fromStage === PersonStage.MADU && toStage !== PersonStage.MDF) {
      throw new AppError('Madu can only be promoted to MDF', 400);
    }
    if (fromStage === PersonStage.MDF && toStage !== PersonStage.RABTAKAR) {
      throw new AppError('MDF can only be promoted to Rabtakar', 400);
    }

    person.currentStage = toStage;
    if (toStage === PersonStage.RABTAKAR) {
      if (!person.roles.includes(OrganizationalResponsibility.RABTAKAR)) {
        person.roles.push(OrganizationalResponsibility.RABTAKAR);
      }
    }

    await person.save();

    const history = await PromotionHistoryModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      personId: person._id,
      fromStage,
      toStage,
      promotedAt: new Date(),
      promotedBy: new Types.ObjectId(userId),
      remarks
    });

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'PERSON_PROMOTED',
      entityType: 'Person',
      entityId: person._id,
      previousState: { stage: fromStage },
      newState: { stage: toStage, remarks }
    });

    return { person, history };
  }

  static async transferPerson(
    workspaceId: string,
    id: string,
    toUnitId: string,
    remarks: string,
    userId: string
  ) {
    const person = await PersonModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!person) {
      throw new AppError('Person not found', 404);
    }

    const targetUnit = await UnitModel.findOne({
      _id: new Types.ObjectId(toUnitId),
      workspaceId: new Types.ObjectId(workspaceId),
      isActive: true
    });

    if (!targetUnit) {
      throw new AppError('Target unit not found in this sector', 404);
    }

    const fromUnitId = person.currentUnitId;
    person.currentUnitId = targetUnit._id;
    await person.save();

    const history = await UnitAssignmentHistoryModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      personId: person._id,
      fromUnitId,
      toUnitId: targetUnit._id,
      transferredAt: new Date(),
      transferredBy: new Types.ObjectId(userId),
      remarks
    });

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'PERSON_TRANSFERRED_UNIT',
      entityType: 'Person',
      entityId: person._id,
      previousState: { unitId: fromUnitId },
      newState: { unitId: targetUnit._id, remarks }
    });

    return { person, history };
  }
}
