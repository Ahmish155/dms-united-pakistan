import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Auth Module Integration Tests', () => {
  it('should successfully register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Secretary Gulraiz',
        email: 'secretary.gulraiz@dms.pk',
        password: 'GulraizSec2026!'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('secretary.gulraiz@dms.pk');
  });

  it('should reject registration with duplicate email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'First User',
        email: 'duplicate@dms.pk',
        password: 'Password123!'
      });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Second User',
        email: 'duplicate@dms.pk',
        password: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate user and return valid token on correct password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Login User',
        email: 'login@dms.pk',
        password: 'CorrectPassword123!'
      });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@dms.pk',
        password: 'CorrectPassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('login@dms.pk');
  });

  it('should reject authentication on incorrect password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Login User 2',
        email: 'login2@dms.pk',
        password: 'CorrectPassword123!'
      });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login2@dms.pk',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
  });
});
