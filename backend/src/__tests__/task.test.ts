import { describe, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { redisClient } from '../config/redis';

describe('📋 Task API & System Health Integration Tests', () => {
  afterAll(async () => {
    await redisClient.quit();
  });
  it('should return 200 OK on GET /health service status endpoint', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  it('should reject task creation without authentication token (401 Unauthorized)', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Unauthorized Test Task',
      priority: 'HIGH',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
