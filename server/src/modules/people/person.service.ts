import { Types } from 'mongoose';
import {
  PersonModel,
  IPersonDoc,
  PromotionHistoryModel,
  UnitAssignmentHistoryModel
} from './person.model';
import { UnitModel } from '../units/unit.model';
import { IndividualMeetingModel } from '../meetings/meeting.model';
import { ActivityEngineService } from '../activity-engine/activity.service';
import { AuditLogModel } from '../audit/auditLog.model';
import {
  PersonStage,
  OrganizationalResponsibility,
  ActivityStatus
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
      currentUnitId: string;
      currentStage: PersonStage;
      roles?: OrganizationalResponsibility[];
      primaryRabtakarId?: string;
      defaultDaeenId?: string;
      notes?: string;
    },
    userId: string
  ) {
    const unit = await UnitModel.findOne({
      _id: new Types.ObjectId(data.currentUnitId),
      workspaceId: new Types.ObjectId(workspaceId),
      isActive: true
    });
    if (!unit) {
      throw new AppError('Specified Unit not found in this sector', 404);
    }

    const internalId = await this.generateInternalId(workspaceId);

    const person = await PersonModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      internalId,
      fullName: data.fullName,
      contactNumber: data.contactNumber,
      currentUnitId: new Types.ObjectId(data.currentUnitId),
      currentStage: data.currentStage || PersonStage.MADU,
      roles: data.roles || [],
      primaryRabtakarId: data.primaryRabtakarId
        ? new Types.ObjectId(data.primaryRabtakarId)
        : undefined,
      defaultDaeenId: data.defaultDaeenId
        ? new Types.ObjectId(data.defaultDaeenId)
        : undefined,
      notes: data.notes,
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
      .sort({ fullName: 1 });

    const thresholds = await ActivityEngineService.getWorkspaceThresholds(workspaceId);

    // Attach dynamic activity status
    const decoratedPeople = await Promise.all(
      people.map(async (p) => {
        const activity = await ActivityEngineService.calculatePersonActivity(
          workspaceId,
          p,
          thresholds
        );
        return {
          ...p.toObject(),
          activityStatus: activity.status,
          daysSinceLastMeeting: activity.daysSinceLastMeeting,
          lastMeetingDate: activity.lastMeetingDate,
          activeAssociatedMaduCount: activity.activeAssociatedMaduCount,
          totalAssociatedMaduCount: activity.totalAssociatedMaduCount
        };
      })
    );

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

    const activity = await ActivityEngineService.calculatePersonActivity(
      workspaceId,
      person
    );

    // Load meeting history
    const meetings = await IndividualMeetingModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      personId: person._id
    })
      .populate('unitId', 'name code')
      .populate('rabtakarId', 'fullName')
      .populate('primaryDaeenId', 'fullName')
      .populate('additionalDaeenIds', 'fullName')
      .sort({ meetingDate: -1 });

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

    // If person is Rabtakar, find associated Madu
    let associatedMadu: any[] = [];
    if (
      person.currentStage === PersonStage.RABTAKAR ||
      person.roles.includes(OrganizationalResponsibility.RABTAKAR)
    ) {
      associatedMadu = await PersonModel.find({
        workspaceId: new Types.ObjectId(workspaceId),
        primaryRabtakarId: person._id,
        isArchived: false
      }).populate('currentUnitId', 'name');
    }

    return {
      person,
      activity,
      meetings,
      promotions,
      transfers,
      associatedMadu
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
