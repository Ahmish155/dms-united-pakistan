import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { SystemRole, AccessRequestStatus } from '@dms/shared';

describe('Workspace Tenancy & Spectator Workflow Tests', () => {
  const registerUser = async (name: string, email: string, role = SystemRole.STANDARD_USER) => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name,
        email,
        password: 'Password123!',
        systemRole: role
      });
    return res.body.data;
  };

  it('should create a workspace and assign creator as Sector Secretary', async () => {
    const secretary = await registerUser('Sector Secretary', 'sec@dms.pk');

    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${secretary.token}`)
      .send({
        name: 'Sector Gulraiz',
        code: 'GULRAIZ'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Sector Gulraiz');
    expect(res.body.data.code).toBe('GULRAIZ');
  });

  it('should enforce complete spectator workflow (request -> approval -> read-only enforcement -> revocation)', async () => {
    // 1. Create Secretary & Workspace
    const secretary = await registerUser('Sec Gulraiz', 'sec.gulraiz@dms.pk');
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${secretary.token}`)
      .send({
        name: 'Sector Gulraiz',
        code: 'GULRAIZ-2'
      });
    const workspaceId = wsRes.body.data._id;

    // 2. Generate Spectator Link
    const linkRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/spectator-link`)
      .set('Authorization', `Bearer ${secretary.token}`)
      .set('x-workspace-id', workspaceId);
    expect(linkRes.status).toBe(200);
    const token = linkRes.body.data.token;
    expect(token).toBeDefined();

    // 3. Spectator registers & submits access request
    const spectator = await registerUser('Spectator Viewer', 'viewer@dms.pk');
    const reqRes = await request(app)
      .post('/api/v1/workspaces/access-requests/submit')
      .set('Authorization', `Bearer ${spectator.token}`)
      .send({
        workspaceId,
        token
      });
    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.data._id;

    // 4. Secretary views pending requests
    const listRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/access-requests`)
      .set('Authorization', `Bearer ${secretary.token}`)
      .set('x-workspace-id', workspaceId);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    // 5. Secretary approves request
    const approveRes = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/access-requests/${requestId}`)
      .set('Authorization', `Bearer ${secretary.token}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: AccessRequestStatus.APPROVED });
    expect(approveRes.status).toBe(200);

    // 6. Spectator can read workspace details
    const readRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${spectator.token}`)
      .set('x-workspace-id', workspaceId);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.workspace.name).toBe('Sector Gulraiz');

    // 7. Spectator cannot modify workspace or generate invite links (mutation blocked with 403)
    const mutateRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/spectator-link`)
      .set('Authorization', `Bearer ${spectator.token}`)
      .set('x-workspace-id', workspaceId);
    expect(mutateRes.status).toBe(403);
    expect(mutateRes.body.message).toContain('Spectator access is strictly read-only');

    // 8. Secretary revokes spectator access
    const revokeRes = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/access-requests/${requestId}`)
      .set('Authorization', `Bearer ${secretary.token}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: AccessRequestStatus.REVOKED });
    expect(revokeRes.status).toBe(200);

    // 9. Spectator is immediately denied read access
    const deniedRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${spectator.token}`)
      .set('x-workspace-id', workspaceId);
    expect(deniedRes.status).toBe(403);
  });

  it('should restrict Super Admin from mutating workspace contents without explicit delegation', async () => {
    const secretary = await registerUser('Sec 3', 'sec3@dms.pk');
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${secretary.token}`)
      .send({
        name: 'Sector Islamabad',
        code: 'ISB'
      });
    const workspaceId = wsRes.body.data._id;

    const superAdmin = await registerUser('Super Admin', 'admin@dms.pk', SystemRole.SUPER_ADMIN);

    // Super Admin can inspect workspace read-only
    const readRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .set('x-workspace-id', workspaceId);
    expect(readRes.status).toBe(200);

    // Super Admin mutation without delegation is forbidden
    const mutateRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/spectator-link`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .set('x-workspace-id', workspaceId);
    expect(mutateRes.status).toBe(403);
    expect(mutateRes.body.message).toContain('Super Admins cannot modify workspace contents without explicit Sector Secretary authorization');
  });
});
