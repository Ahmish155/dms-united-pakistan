import { Types } from 'mongoose';
import { IndividualMeetingModel, IIndividualMeetingDoc } from './meeting.model';
import { PersonModel, IPersonDoc } from '../people/person.model';
import { AuditLogModel } from '../audit/auditLog.model';
import { PersonStage } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class MeetingService {
  static async recordMeeting(
    workspaceId: string,
    data: {
      personId: string;
      rabtakarId?: string;
      primaryDaeenId?: string;
      additionalDaeenIds?: string[];
      meetingDate: string;
      meetingNumber?: number;
      comments?: string;
      allowDuplicate?: boolean;
    },
    userId: string
  ) {
    const person = (await PersonModel.findOne({
      _id: new Types.ObjectId(data.personId),
      workspaceId: new Types.ObjectId(workspaceId)
    }).exec()) as IPersonDoc | null;

    if (!person) {
      throw new AppError('Person not found in this sector', 404);
    }

    if (
      person.currentStage !== PersonStage.MADU &&
      person.currentStage !== PersonStage.MDF
    ) {
      throw new AppError(
        'Individual meetings can only be recorded for Madu or MDF',
        400
      );
    }

    // Determine Rabtakar & Daeen (auto-fallback to person defaults if omitted)
    const rabtakarId = data.rabtakarId || person.primaryRabtakarId?.toString();
    const primaryDaeenId = data.primaryDaeenId || person.defaultDaeenId?.toString();

    if (!rabtakarId) {
      throw new AppError('Rabtakar is required for individual meeting', 400);
    }
    if (!primaryDaeenId) {
      throw new AppError('Primary Daeen is required for individual meeting', 400);
    }

    const meetingDate = new Date(data.meetingDate);

    // Calculate meeting number if not provided
    let meetingNumber = data.meetingNumber;
    if (!meetingNumber || meetingNumber <= 0) {
      const priorCount = await IndividualMeetingModel.countDocuments({
        workspaceId: new Types.ObjectId(workspaceId),
        personId: person._id
      });
      meetingNumber = priorCount + 1;
    }

    // Duplicate detection check
    const startOfDay = new Date(meetingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(meetingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingMeeting = await IndividualMeetingModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      personId: person._id,
      meetingDate: { $gte: startOfDay, $lte: endOfDay },
      meetingNumber
    });

    if (existingMeeting && !data.allowDuplicate) {
      throw new AppError(
        `A meeting (#${meetingNumber}) for ${person.fullName} on ${meetingDate.toISOString().split('T')[0]} has already been recorded. Set allowDuplicate to confirm.`,
        409
      );
    }

    // Attribute unit at meeting time
    const meeting = await IndividualMeetingModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      unitId: person.currentUnitId,
      personId: person._id,
      personStageAtTime: person.currentStage,
      rabtakarId: new Types.ObjectId(rabtakarId),
      primaryDaeenId: new Types.ObjectId(primaryDaeenId),
      additionalDaeenIds: (data.additionalDaeenIds || []).map(
        (id) => new Types.ObjectId(id)
      ),
      meetingDate,
      meetingNumber,
      comments: data.comments,
      createdById: new Types.ObjectId(userId)
    });

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'MEETING_RECORDED',
      entityType: 'IndividualMeeting',
      entityId: meeting._id,
      newState: meeting.toObject()
    });

    return meeting;
  }

  static async getMeetings(
    workspaceId: string,
    filters?: {
      unitId?: string;
      personId?: string;
      rabtakarId?: string;
      primaryDaeenId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const query: any = {
      workspaceId: new Types.ObjectId(workspaceId)
    };

    if (filters?.unitId) {
      query.unitId = new Types.ObjectId(filters.unitId);
    }
    if (filters?.personId) {
      query.personId = new Types.ObjectId(filters.personId);
    }
    if (filters?.rabtakarId) {
      query.rabtakarId = new Types.ObjectId(filters.rabtakarId);
    }
    if (filters?.primaryDaeenId) {
      query.$or = [
        { primaryDaeenId: new Types.ObjectId(filters.primaryDaeenId) },
        { additionalDaeenIds: new Types.ObjectId(filters.primaryDaeenId) }
      ];
    }
    if (filters?.startDate || filters?.endDate) {
      query.meetingDate = {};
      if (filters.startDate) {
        query.meetingDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.meetingDate.$lte = end;
      }
    }

    const meetings = await IndividualMeetingModel.find(query)
      .populate('unitId', 'name code')
      .populate('personId', 'fullName internalId currentStage')
      .populate('rabtakarId', 'fullName internalId')
      .populate('primaryDaeenId', 'fullName internalId')
      .populate('additionalDaeenIds', 'fullName internalId')
      .sort({ meetingDate: -1 });

    return meetings;
  }

  static async getMeetingById(workspaceId: string, id: string) {
    const meeting = (await IndividualMeetingModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    })
      .populate('unitId', 'name code')
      .populate('personId', 'fullName internalId currentStage')
      .populate('rabtakarId', 'fullName internalId')
      .populate('primaryDaeenId', 'fullName internalId')
      .populate('additionalDaeenIds', 'fullName internalId')
      .exec()) as IIndividualMeetingDoc | null;

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }
    return meeting;
  }

  static async updateMeeting(
    workspaceId: string,
    id: string,
    data: any,
    userId: string
  ) {
    const meeting = await IndividualMeetingModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const previousState = meeting.toObject();

    if (data.personId) meeting.personId = new Types.ObjectId(data.personId);
    if (data.unitId) meeting.unitId = new Types.ObjectId(data.unitId);
    if (data.meetingDate) meeting.meetingDate = new Date(data.meetingDate);
    if (data.meetingNumber) meeting.meetingNumber = data.meetingNumber;
    if (data.rabtakarId) meeting.rabtakarId = new Types.ObjectId(data.rabtakarId);
    if (data.primaryDaeenId) meeting.primaryDaeenId = new Types.ObjectId(data.primaryDaeenId);
    if (data.additionalDaeenIds) {
      meeting.additionalDaeenIds = data.additionalDaeenIds.map(
        (aid: string) => new Types.ObjectId(aid)
      );
    }
    if (data.comments !== undefined) meeting.comments = data.comments;

    await meeting.save();

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'MEETING_UPDATED',
      entityType: 'IndividualMeeting',
      entityId: meeting._id,
      previousState,
      newState: meeting.toObject()
    });

    return meeting;
  }

  static async deleteMeeting(workspaceId: string, id: string, userId: string) {
    const meeting = await IndividualMeetingModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId)
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    await IndividualMeetingModel.deleteOne({ _id: meeting._id });

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'MEETING_DELETED',
      entityType: 'IndividualMeeting',
      entityId: meeting._id,
      previousState: meeting.toObject()
    });

    return { success: true, message: 'Meeting record deleted successfully' };
  }
}
