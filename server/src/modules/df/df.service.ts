import { Types } from 'mongoose';
import {
  DfMentorModel,
  DialogueForumModel,
  DfAttendanceModel,
  IDialogueForumDoc
} from './df.model';
import { PersonModel } from '../people/person.model';
import { WorkspaceSettingsModel } from '../workspaces/workspace.model';
import { AuditLogModel } from '../audit/auditLog.model';
import {
  ParticipantCategory,
  ActivityStatus,
  DEFAULT_THRESHOLDS
} from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class DfService {
  static async createMentor(
    workspaceId: string,
    data: {
      personId?: string;
      name: string;
      contact?: string;
      specialization?: string;
    }
  ) {
    return DfMentorModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      personId: data.personId ? new Types.ObjectId(data.personId) : undefined,
      name: data.name,
      contact: data.contact,
      specialization: data.specialization,
      isActive: true
    });
  }

  static async getMentors(workspaceId: string) {
    return DfMentorModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isActive: true
    }).sort({ name: 1 });
  }

  static async recordDialogueForum(
    workspaceId: string,
    data: {
      unitId: string;
      date: string;
      mentorId: string;
      topic?: string;
      comments?: string;
      participants: Array<{
        personId: string;
        category: ParticipantCategory;
        status?: 'ATTENDED' | 'ABSENT';
      }>;
    },
    userId: string
  ) {
    const df = await DialogueForumModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      unitId: new Types.ObjectId(data.unitId),
      date: new Date(data.date),
      mentorId: new Types.ObjectId(data.mentorId),
      topic: data.topic,
      comments: data.comments,
      createdById: new Types.ObjectId(userId)
    });

    if (data.participants && data.participants.length > 0) {
      for (const p of data.participants) {
        await DfAttendanceModel.create({
          workspaceId: new Types.ObjectId(workspaceId),
          dfId: df._id,
          personId: new Types.ObjectId(p.personId),
          category: p.category,
          status: p.status || 'ATTENDED'
        });
      }
    }

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'DF_RECORDED',
      entityType: 'DialogueForum',
      entityId: df._id,
      newState: { topic: data.topic, participantCount: data.participants?.length || 0 }
    });

    return df;
  }

  static async getDialogueForums(
    workspaceId: string,
    filters?: { unitId?: string; startDate?: string; endDate?: string }
  ) {
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };
    if (filters?.unitId) query.unitId = new Types.ObjectId(filters.unitId);
    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const forums = await DialogueForumModel.find(query)
      .populate('unitId', 'name code')
      .populate('mentorId', 'name specialization')
      .sort({ date: -1 });

    // Fetch attendance for each forum
    const results = await Promise.all(
      forums.map(async (f) => {
        const attendance = await DfAttendanceModel.find({ dfId: f._id })
          .populate('personId', 'fullName internalId currentStage')
          .lean();
        return {
          ...f.toObject(),
          attendance
        };
      })
    );

    return results;
  }

  static async updateDialogueForum(
    workspaceId: string,
    dfId: string,
    data: {
      unitId?: string;
      date?: string;
      mentorId?: string;
      topic?: string;
      comments?: string;
      participants?: Array<{
        personId: string;
        category: ParticipantCategory;
        status?: 'ATTENDED' | 'ABSENT';
      }>;
    },
    userId: string
  ) {
    const df = await DialogueForumModel.findOne({
      _id: new Types.ObjectId(dfId),
      workspaceId: new Types.ObjectId(workspaceId)
    });
    if (!df) throw new AppError('Dialogue Forum not found', 404);

    if (data.unitId) df.unitId = new Types.ObjectId(data.unitId);
    if (data.date) df.date = new Date(data.date);
    if (data.mentorId) df.mentorId = new Types.ObjectId(data.mentorId);
    if (data.topic !== undefined) (df as any).topic = data.topic;
    if (data.comments !== undefined) (df as any).comments = data.comments;
    await df.save();

    if (data.participants !== undefined) {
      await DfAttendanceModel.deleteMany({ dfId: df._id });
      for (const p of data.participants) {
        await DfAttendanceModel.create({
          workspaceId: new Types.ObjectId(workspaceId),
          dfId: df._id,
          personId: new Types.ObjectId(p.personId),
          category: p.category,
          status: p.status || 'ATTENDED'
        });
      }
    }

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'DF_UPDATED',
      entityType: 'DialogueForum',
      entityId: df._id,
      newState: data
    });

    return df;
  }

  static async deleteDialogueForum(
    workspaceId: string,
    dfId: string,
    userId: string
  ) {
    const df = await DialogueForumModel.findOne({
      _id: new Types.ObjectId(dfId),
      workspaceId: new Types.ObjectId(workspaceId)
    });
    if (!df) throw new AppError('Dialogue Forum not found', 404);

    await DfAttendanceModel.deleteMany({ dfId: df._id });
    await df.deleteOne();

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'DF_DELETED',
      entityType: 'DialogueForum',
      entityId: df._id,
      newState: {}
    });

    return { deleted: true };
  }

  static async getDfAnalytics(workspaceId: string) {
    const settings = (await WorkspaceSettingsModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId)
    }).exec()) as any;
    const dfDays = settings?.thresholds?.dfDays || DEFAULT_THRESHOLDS.dfDays;

    const totalEvents = await DialogueForumModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId)
    });

    // Attendance stats per person
    const people = await PersonModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isArchived: false
    })
      .populate('currentUnitId', 'name')
      .lean();

    const now = new Date();

    const participantStats = await Promise.all(
      people.map(async (person: any) => {
        const records = await DfAttendanceModel.find({
          workspaceId: new Types.ObjectId(workspaceId),
          personId: person._id,
          status: 'ATTENDED'
        })
          .populate('dfId', 'date topic')
          .sort({ 'dfId.date': -1 })
          .lean();

        let lastAttendedDate: string | null = null;
        let daysSinceLast: number | null = null;
        let isParticipatingActive = false;

        if (records.length > 0 && records[0].dfId) {
          const date = new Date((records[0].dfId as any).date);
          lastAttendedDate = date.toISOString();
          const diff = Math.abs(now.getTime() - date.getTime());
          daysSinceLast = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (daysSinceLast <= dfDays) {
            isParticipatingActive = true;
          }
        }

        return {
          personId: person._id,
          fullName: person.fullName,
          internalId: person.internalId,
          stage: person.currentStage,
          unitName: person.currentUnitId?.name || 'N/A',
          totalAttended: records.length,
          lastAttendedDate,
          daysSinceLast,
          status: isParticipatingActive ? ActivityStatus.ACTIVE : ActivityStatus.INACTIVE
        };
      })
    );

    return {
      dfThresholdDays: dfDays,
      totalEvents,
      activeParticipantsCount: participantStats.filter(
        (p) => p.status === ActivityStatus.ACTIVE
      ).length,
      inactiveParticipantsCount: participantStats.filter(
        (p) => p.status === ActivityStatus.INACTIVE
      ).length,
      participants: participantStats
    };
  }
}
