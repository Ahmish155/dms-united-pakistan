import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PersonStage, OrganizationalResponsibility, DmmStatus } from '@dms/shared';

describe('Individual Meetings, DMM & RMM Planning Integration Tests', () => {
  const setupContext = async () => {
    const secRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sec Planning',
        email: `sec.plan.${Date.now()}@dms.pk`,
        password: 'Password123!'
      });
    const token = secRes.body.data.token;

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sector Gulraiz',
        code: `GP${Math.floor(Math.random() * 8999 + 1000)}`
      });
    const workspaceId = wsRes.body.data._id;

    const unitRes = await request(app)
      .post('/api/v1/units')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Morgah', code: 'MOR' });
    const unitId = unitRes.body.data._id;

    // Create Daeen
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

    // Create Rabtakar
    const rbtRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Hamza Rabtakar',
        currentUnitId: unitId,
        currentStage: PersonStage.RABTAKAR,
        roles: [OrganizationalResponsibility.RABTAKAR]
      });
    const rabtakarId = rbtRes.body.data._id;

    // Create Madu
    const maduRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Tayyab Madu',
        currentUnitId: unitId,
        currentStage: PersonStage.MADU,
        primaryRabtakarId: rabtakarId,
        defaultDaeenId: daeenId
      });
    const maduId = maduRes.body.data._id;

    return { token, workspaceId, unitId, daeenId, rabtakarId, maduId };
  };

  it('should record an individual meeting and prevent accidental duplicate entry', async () => {
    const { token, workspaceId, unitId, daeenId, rabtakarId, maduId } = await setupContext();

    const today = new Date().toISOString();

    // 1. Record Meeting
    const meetRes = await request(app)
      .post('/api/v1/meetings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        personId: maduId,
        rabtakarId,
        primaryDaeenId: daeenId,
        meetingDate: today,
        meetingNumber: 1,
        comments: 'Excellent first meeting'
      });

    expect(meetRes.status).toBe(201);
    expect(meetRes.body.data.meetingNumber).toBe(1);
    expect(meetRes.body.data.unitId).toBe(unitId);

    // 2. Duplicate detection warning (same person, same date, same number without allowDuplicate)
    const dupRes = await request(app)
      .post('/api/v1/meetings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        personId: maduId,
        rabtakarId,
        primaryDaeenId: daeenId,
        meetingDate: today,
        meetingNumber: 1,
        comments: 'Accidental duplicate entry'
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.message).toContain('already been recorded');

    // 3. Confirm with allowDuplicate=true
    const allowedDupRes = await request(app)
      .post('/api/v1/meetings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        personId: maduId,
        rabtakarId,
        primaryDaeenId: daeenId,
        meetingDate: today,
        meetingNumber: 1,
        comments: 'Genuine follow-up discussion',
        allowDuplicate: true
      });

    expect(allowedDupRes.status).toBe(201);
  });

  it('should create DMM targets and accurately compute monthly variance against actual meetings', async () => {
    const { token, workspaceId, unitId, daeenId, rabtakarId, maduId } = await setupContext();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // 1. Record 2 completed meetings this month for Madu
    await request(app)
      .post('/api/v1/meetings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        personId: maduId,
        rabtakarId,
        primaryDaeenId: daeenId,
        meetingDate: new Date().toISOString(),
        meetingNumber: 1
      });

    await request(app)
      .post('/api/v1/meetings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        personId: maduId,
        rabtakarId,
        primaryDaeenId: daeenId,
        meetingDate: new Date().toISOString(),
        meetingNumber: 2
      });

    // 2. Create DMM with target of 4 meetings for this Madu
    const dmmRes = await request(app)
      .post('/api/v1/dmm')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        month: currentMonth,
        year: currentYear,
        status: DmmStatus.DRAFT,
        expectedMscCount: 1,
        expectedMdfCount: 1,
        targets: [
          {
            unitId,
            personId: maduId,
            targetMeetings: 4,
            rabtakarId,
            daeenId,
            category: PersonStage.MADU
          }
        ]
      });

    expect(dmmRes.status).toBe(200);
    const { summary, unitConclusions } = dmmRes.body.data;

    // Sector total targets: 4, actual: 2, remaining: 2, completion: 50%
    expect(summary.sectorTotalTarget).toBe(4);
    expect(summary.sectorTotalActual).toBe(2);
    expect(summary.sectorTotalRemaining).toBe(2);
    expect(summary.sectorCompletionPercentage).toBe(50);

    // Unit conclusion
    expect(unitConclusions.length).toBe(1);
    expect(unitConclusions[0].targets[0].actualMeetings).toBe(2);
    expect(unitConclusions[0].targets[0].remainingMeetings).toBe(2);
    expect(unitConclusions[0].targets[0].completionPercentage).toBe(50);
  });

  it('should create RMM weekly targets and compute weekly progress tracking', async () => {
    const { token, workspaceId, unitId, daeenId, rabtakarId, maduId } = await setupContext();

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 1);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 5);

    // 1. Record 1 meeting during the week
    await request(app)
      .post('/api/v1/meetings')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        personId: maduId,
        rabtakarId,
        primaryDaeenId: daeenId,
        meetingDate: new Date().toISOString(),
        meetingNumber: 1
      });

    // 2. Create RMM with target of 2 meetings
    const rmmRes = await request(app)
      .post('/api/v1/rmm')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        unitId,
        rmmDate: new Date().toISOString(),
        weekStartDate: weekStart.toISOString(),
        weekEndDate: weekEnd.toISOString(),
        comments: 'Weekly planning session',
        targets: [
          {
            personId: maduId,
            category: PersonStage.MADU,
            nextWeekTarget: 2,
            expectedDay: 'Tuesday'
          }
        ]
      });

    expect(rmmRes.status).toBe(201);
    const { summary, targets } = rmmRes.body.data;

    expect(summary.totalPlanned).toBe(2);
    expect(summary.totalActualCompleted).toBe(1);
    expect(summary.totalRemaining).toBe(1);
    expect(summary.overallCompletionPercentage).toBe(50);
    expect(targets[0].expectedDay).toBe('Tuesday');
  });
});
