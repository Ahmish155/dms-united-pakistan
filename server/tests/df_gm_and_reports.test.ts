import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PersonStage, OrganizationalResponsibility, ParticipantCategory, ActivityStatus } from '@dms/shared';

describe('DF, GM and Reporting Module Integration Tests', () => {
  const setupContext = async () => {
    const secRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sec Reports',
        email: `sec.rep.${Date.now()}@dms.pk`,
        password: 'Password123!'
      });
    const token = secRes.body.data.token;

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sector Gulraiz',
        code: `GR${Math.floor(Math.random() * 8999 + 1000)}`
      });
    const workspaceId = wsRes.body.data._id;

    const unitRes = await request(app)
      .post('/api/v1/units')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Morgah', code: 'MOR' });
    const unitId = unitRes.body.data._id;

    const personRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Tayyab Madu',
        currentUnitId: unitId,
        currentStage: PersonStage.MADU
      });
    const personId = personRes.body.data._id;

    return { token, workspaceId, unitId, personId };
  };

  it('should record DF with mentor and track participation analytics', async () => {
    const { token, workspaceId, unitId, personId } = await setupContext();

    // 1. Create DF Mentor
    const mentorRes = await request(app)
      .post('/api/v1/df/mentors')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        name: 'Mentor Haroon',
        specialization: 'Dawati Training'
      });
    expect(mentorRes.status).toBe(201);
    const mentorId = mentorRes.body.data._id;

    // 2. Record DF session
    const dfRes = await request(app)
      .post('/api/v1/df')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        unitId,
        date: new Date().toISOString(),
        mentorId,
        topic: 'Foundations of Dawat',
        participants: [
          {
            personId,
            category: ParticipantCategory.MADU,
            status: 'ATTENDED'
          }
        ]
      });
    expect(dfRes.status).toBe(201);

    // 3. Query DF Analytics
    const analyticsRes = await request(app)
      .get('/api/v1/df/analytics')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.totalEvents).toBe(1);
    const participant = analyticsRes.body.data.participants.find(
      (p: any) => p.personId === personId
    );
    expect(participant.status).toBe(ActivityStatus.ACTIVE);
    expect(participant.totalAttended).toBe(1);
  });

  it('should record GM and track independent GM participation analytics', async () => {
    const { token, workspaceId, unitId, personId } = await setupContext();

    // 1. Record GM
    const gmRes = await request(app)
      .post('/api/v1/gm')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        unitId,
        date: new Date().toISOString(),
        topic: 'Weekly Study Circle',
        participants: [
          {
            personId,
            category: ParticipantCategory.MADU,
            status: 'ATTENDED'
          }
        ]
      });
    expect(gmRes.status).toBe(201);

    // 2. Query GM Analytics
    const analyticsRes = await request(app)
      .get('/api/v1/gm/analytics')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.totalEvents).toBe(1);
  });

  it('should generate Weekly Dawati Report and export to multiple formats', async () => {
    const { token, workspaceId } = await setupContext();

    const start = '2026-11-15';
    const end = '2026-11-22';

    const repRes = await request(app)
      .get(`/api/v1/reports/weekly?startDate=${start}&endDate=${end}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);

    expect(repRes.status).toBe(200);
    expect(repRes.body.data.whatsappText).toContain('Weekly Dawati Report');
    expect(repRes.body.data.whatsappText).toContain('APP SYNCED: YES');

    // Test text export
    const txtRes = await request(app)
      .get(`/api/v1/reports/export/txt?startDate=${start}&endDate=${end}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);
    expect(txtRes.status).toBe(200);
    expect(txtRes.text).toContain('Weekly Dawati Report');

    // Test CSV export
    const csvRes = await request(app)
      .get(`/api/v1/reports/export/csv?startDate=${start}&endDate=${end}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);
    expect(csvRes.status).toBe(200);
    expect(csvRes.text).toContain('Category,Count');

    // Test Word export
    const docRes = await request(app)
      .get(`/api/v1/reports/export/doc?startDate=${start}&endDate=${end}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);
    expect(docRes.status).toBe(200);
    expect(docRes.text).toContain('Weekly Dawati Report');
  });
});
