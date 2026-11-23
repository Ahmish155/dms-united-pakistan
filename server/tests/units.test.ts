import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Units Module Integration Tests', () => {
  const setupWorkspace = async () => {
    const secRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sec Gulraiz Units',
        email: `sec.units.${Date.now()}@dms.pk`,
        password: 'Password123!'
      });
    const token = secRes.body.data.token;

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sector Gulraiz',
        code: `GUL${Math.floor(Math.random() * 8999 + 1000)}`
      });
    const workspaceId = wsRes.body.data._id;

    return { token, workspaceId };
  };

  it('should create and list units in a workspace', async () => {
    const { token, workspaceId } = await setupWorkspace();

    const createRes = await request(app)
      .post('/api/v1/units')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        name: 'Morgah',
        code: 'MOR'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Morgah');
    expect(createRes.body.data.code).toBe('MOR');

    // Reject duplicate in same workspace
    const dupRes = await request(app)
      .post('/api/v1/units')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId)
      .send({
        name: 'Morgah',
        code: 'MOR2'
      });
    expect(dupRes.status).toBe(409);

    // List units
    const listRes = await request(app)
      .get('/api/v1/units')
      .set('Authorization', `Bearer ${token}`)
      .set('x-workspace-id', workspaceId);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].name).toBe('Morgah');
  });
});
