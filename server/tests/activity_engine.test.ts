import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PersonStage, OrganizationalResponsibility, ActivityStatus } from '@dms/shared';
import { IndividualMeetingModel } from '../src/modules/meetings/meeting.model';
import { Types } from 'mongoose';

describe('Activity Engine & Threshold Tests', () => {
  const setupContext = async () => {
    const secRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sec Activity',
        email: `sec.activity.${Date.now()}@dms.pk`,
        password: 'Password123!'
      });
    const token = secRes.body.data.token;
    const userId = secRes.body.data.user.id;

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sector Gulraiz',
        code: `GA${Math.floor(Math.random() * 8999 + 1000)}`
      });
    const workspaceId = wsRes.body.data._id;

    const unitRes = await request(app)
      .post('/api/v1/units')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Morgah', code: 'MOR' });
    const unitId = unitRes.body.data._id;

    return { token, workspaceId, unitId, userId };
  };

  it('should accurately calculate Madu, Rabtakar, and Daeen statuses dynamically', async () => {
    const { token, workspaceId, unitId, userId } = await setupContext();

    // 1. Create Daeen
    const daeenRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Shahzaib Daeen',
        currentUnitId: unitId,
        currentStage: PersonStage.OTHER,
        roles: [OrganizationalResponsibility.DAEEN]
      });
    const daeenId = daeenRes.body.data._id;

    // 2. Create Rabtakar
    const rabtakarRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Hamza Rabtakar',
        currentUnitId: unitId,
        currentStage: PersonStage.RABTAKAR,
        roles: [OrganizationalResponsibility.RABTAKAR]
      });
    const rabtakarId = rabtakarRes.body.data._id;

    // 3. Create Madu 1 (recent meeting -> will be ACTIVE)
    const madu1Res = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Active Madu Tayyab',
        currentUnitId: unitId,
        currentStage: PersonStage.MADU,
        primaryRabtakarId: rabtakarId,
        defaultDaeenId: daeenId
      });
    const madu1Id = madu1Res.body.data._id;

    // Create completed meeting 3 days ago for Madu 1
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await IndividualMeetingModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      unitId: new Types.ObjectId(unitId),
      personId: new Types.ObjectId(madu1Id),
      personStageAtTime: PersonStage.MADU,
      rabtakarId: new Types.ObjectId(rabtakarId),
      primaryDaeenId: new Types.ObjectId(daeenId),
      additionalDaeenIds: [],
      meetingDate: threeDaysAgo,
      meetingNumber: 1,
      comments: 'Very positive discussion',
      createdById: new Types.ObjectId(userId)
    });

    // 4. Create Madu 2 (old meeting 20 days ago -> will be INACTIVE under default 14-day threshold)
    const madu2Res = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Inactive Madu Wasi',
        currentUnitId: unitId,
        currentStage: PersonStage.MADU,
        primaryRabtakarId: rabtakarId,
        defaultDaeenId: daeenId
      });
    const madu2Id = madu2Res.body.data._id;

    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    await IndividualMeetingModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      unitId: new Types.ObjectId(unitId),
      personId: new Types.ObjectId(madu2Id),
      personStageAtTime: PersonStage.MADU,
      rabtakarId: new Types.ObjectId(rabtakarId),
      primaryDaeenId: new Types.ObjectId(daeenId),
      additionalDaeenIds: [],
      meetingDate: twentyDaysAgo,
      meetingNumber: 1,
      comments: 'Introductory meet',
      createdById: new Types.ObjectId(userId)
    });

    // 5. Query people list and verify statuses
    const listRes = await request(app)
      .get('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);

    expect(listRes.status).toBe(200);
    const people = listRes.body.data;

    const m1 = people.find((p: any) => p._id === madu1Id);
    expect(m1.activityStatus).toBe(ActivityStatus.ACTIVE);
    expect(m1.daysSinceLastMeeting).toBe(3);

    const m2 = people.find((p: any) => p._id === madu2Id);
    expect(m2.activityStatus).toBe(ActivityStatus.INACTIVE);
    expect(m2.daysSinceLastMeeting).toBe(20);

    // Rabtakar has at least 1 active Madu (Madu 1), so Rabtakar must be ACTIVE
    const rbt = people.find((p: any) => p._id === rabtakarId);
    expect(rbt.activityStatus).toBe(ActivityStatus.ACTIVE);
    expect(rbt.activeAssociatedMaduCount).toBe(1);

    // Daeen conducted a meeting 3 days ago, so Daeen must be ACTIVE
    const dae = people.find((p: any) => p._id === daeenId);
    expect(dae.activityStatus).toBe(ActivityStatus.ACTIVE);

    // 6. Test threshold adjustment: Increase maduDays to 25 -> Madu 2 becomes ACTIVE!
    const updateSettingsRes = await request(app)
      .patch('/api/v1/settings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        thresholds: {
          maduDays: 25
        }
      });
    expect(updateSettingsRes.status).toBe(200);

    // Re-query people
    const listResAfter = await request(app)
      .get('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);

    const m2After = listResAfter.body.data.find((p: any) => p._id === madu2Id);
    expect(m2After.activityStatus).toBe(ActivityStatus.ACTIVE);
  });
});
