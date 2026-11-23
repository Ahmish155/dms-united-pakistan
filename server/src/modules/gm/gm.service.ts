import { Types } from 'mongoose';
import { GroupMeetingModel, GmAttendanceModel, IGroupMeetingDoc } from './gm.model';
import { PersonModel } from '../people/person.model';
import { WorkspaceSettingsModel } from '../workspaces/workspace.model';
import { AuditLogModel } from '../audit/auditLog.model';
import { ParticipantCategory, ActivityStatus, DEFAULT_THRESHOLDS } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class GmService {
  static async recordGroupMeeting(
    workspaceId: string,
    data: {
      unitId: string;
      date: string;
      facilitatorPersonId?: string;
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
    const gm = await GroupMeetingModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      unitId: new Types.ObjectId(data.unitId),
      date: new Date(data.date),
      facilitatorPersonId: data.facilitatorPersonId
        ? new Types.ObjectId(data.facilitatorPersonId)
        : undefined,
      topic: data.topic,
      comments: data.comments,
      createdById: new Types.ObjectId(userId)
    });

    if (data.participants && data.participants.length > 0) {
      for (const p of data.participants) {
        await GmAttendanceModel.create({
          workspaceId: new Types.ObjectId(workspaceId),
          gmId: gm._id,
          personId: new Types.ObjectId(p.personId),
          category: p.category,
          status: p.status || 'ATTENDED'
        });
      }
    }

    await AuditLogModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action: 'GM_RECORDED',
      entityType: 'GroupMeeting',
      entityId: gm._id,
      newState: { topic: data.topic, participantCount: data.participants?.length || 0 }
    });

    return gm;
  }

  static async getGroupMeetings(
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

    const meetings = await GroupMeetingModel.find(query)
      .populate('unitId', 'name code')
      .populate('facilitatorPersonId', 'fullName')
      .sort({ date: -1 });

    const results = await Promise.all(
      meetings.map(async (g) => {
        const attendance = await GmAttendanceModel.find({ gmId: g._id })
          .populate('personId', 'fullName internalId currentStage')
          .lean();
        return {
          ...g.toObject(),
          attendance
        };
      })
    );

    return results;
  }

  static async getGmAnalytics(workspaceId: string) {
    const settings = (await WorkspaceSettingsModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId)
    }).exec()) as any;
    const gmDays = settings?.thresholds?.gmDays || DEFAULT_THRESHOLDS.gmDays;

    const totalEvents = await GroupMeetingModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId)
    });

    const people = await PersonModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isArchived: false
    })
      .populate('currentUnitId', 'name')
      .lean();

    const now = new Date();

    const participantStats = await Promise.all(
      people.map(async (person: any) => {
        const records = await GmAttendanceModel.find({
          workspaceId: new Types.ObjectId(workspaceId),
          personId: person._id,
          status: 'ATTENDED'
        })
          .populate('gmId', 'date topic')
          .sort({ 'gmId.date': -1 })
          .lean();

        let lastAttendedDate: string | null = null;
        let daysSinceLast: number | null = null;
        let isParticipatingActive = false;

        if (records.length > 0 && records[0].gmId) {
          const date = new Date((records[0].gmId as any).date);
          lastAttendedDate = date.toISOString();
          const diff = Math.abs(now.getTime() - date.getTime());
          daysSinceLast = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (daysSinceLast <= gmDays) {
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
      gmThresholdDays: gmDays,
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
