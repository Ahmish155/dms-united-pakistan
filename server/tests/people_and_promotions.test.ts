import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PersonStage, OrganizationalResponsibility } from '@dms/shared';

describe('People, Promotions & Unit Transfer Tests', () => {
  const setupContext = async () => {
    const secRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sec People',
        email: `sec.people.${Date.now()}@dms.pk`,
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

    // Create 2 units: Morgah and Lalkurti
    const unit1Res = await request(app)
      .post('/api/v1/units')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Morgah', code: 'MOR' });

    const unit2Res = await request(app)
      .post('/api/v1/units')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Lalkurti', code: 'LAL' });

    return {
      token,
      workspaceId,
      unit1Id: unit1Res.body.data._id,
      unit2Id: unit2Res.body.data._id
    };
  };

  it('should create person with multiple responsibilities (Rabtakar + Daeen)', async () => {
    const { token, workspaceId, unit1Id } = await setupContext();

    const personRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Hamza Shahid',
        contactNumber: '03001234567',
        currentUnitId: unit1Id,
        currentStage: PersonStage.RABTAKAR,
        roles: [
          OrganizationalResponsibility.RABTAKAR,
          OrganizationalResponsibility.DAEEN
        ]
      });

    expect(personRes.status).toBe(201);
    expect(personRes.body.data.internalId).toMatch(/^UP-\d{4}$/);
    expect(personRes.body.data.roles).toContain(OrganizationalResponsibility.RABTAKAR);
    expect(personRes.body.data.roles).toContain(OrganizationalResponsibility.DAEEN);
  });

  it('should promote Madu -> MDF and MDF -> Rabtakar preserving history', async () => {
    const { token, workspaceId, unit1Id } = await setupContext();

    // 1. Create Rabtakar
    const rabtakarRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Arslan Ali',
        currentUnitId: unit1Id,
        currentStage: PersonStage.RABTAKAR,
        roles: [OrganizationalResponsibility.RABTAKAR]
      });
    const rabtakarId = rabtakarRes.body.data._id;

    // 2. Create Madu
    const maduRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Tayyab Mahmood',
        currentUnitId: unit1Id,
        currentStage: PersonStage.MADU,
        primaryRabtakarId: rabtakarId
      });
    const maduId = maduRes.body.data._id;
    expect(maduRes.body.data.currentStage).toBe(PersonStage.MADU);

    // 3. Promote Madu to MDF
    const promoteMdfRes = await request(app)
      .post(`/api/v1/people/${maduId}/promote`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        toStage: PersonStage.MDF,
        remarks: 'Completed required Dawati meetings'
      });

    expect(promoteMdfRes.status).toBe(200);
    expect(promoteMdfRes.body.data.person.currentStage).toBe(PersonStage.MDF);
    expect(promoteMdfRes.body.data.history.fromStage).toBe(PersonStage.MADU);
    expect(promoteMdfRes.body.data.history.toStage).toBe(PersonStage.MDF);

    // 4. Promote MDF to Rabtakar
    const promoteRbtRes = await request(app)
      .post(`/api/v1/people/${maduId}/promote`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        toStage: PersonStage.RABTAKAR,
        remarks: 'Active member ready to guide others'
      });

    expect(promoteRbtRes.status).toBe(200);
    expect(promoteRbtRes.body.data.person.currentStage).toBe(PersonStage.RABTAKAR);
    expect(promoteRbtRes.body.data.person.roles).toContain(OrganizationalResponsibility.RABTAKAR);

    // 5. Check Person Profile with full promotion history
    const profileRes = await request(app)
      .get(`/api/v1/people/${maduId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.promotions.length).toBe(2);
  });

  it('should transfer a person to another unit and preserve transfer history', async () => {
    const { token, workspaceId, unit1Id, unit2Id } = await setupContext();

    const personRes = await request(app)
      .post('/api/v1/people')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        fullName: 'Wasi Khan',
        currentUnitId: unit1Id,
        currentStage: PersonStage.MADU
      });
    const personId = personRes.body.data._id;

    const transferRes = await request(app)
      .post(`/api/v1/people/${personId}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        toUnitId: unit2Id,
        remarks: 'Relocated residence to Lalkurti'
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.data.person.currentUnitId).toBe(unit2Id);
    expect(transferRes.body.data.history.fromUnitId).toBe(unit1Id);
    expect(transferRes.body.data.history.toUnitId).toBe(unit2Id);

    // Verify history in profile
    const profileRes = await request(app)
      .get(`/api/v1/people/${personId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.transfers.length).toBe(1);
  });
});
