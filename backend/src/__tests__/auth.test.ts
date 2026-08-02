import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { config } from '../config';
import { redisClient } from '../config/redis';

jest.setTimeout(20000);

describe('🔒 Authentication & JWT Security API Tests', () => {
  beforeAll(async () => {
    // 🟢 Connect to MongoDB Atlas for integration testing
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }
  });

  afterAll(async () => {
    // 🟢 Clean up open handles (MongoDB + Redis)
    await mongoose.connection.close();
    await redisClient.quit();
  });

  it('should reject login attempt with invalid credentials (401 Unauthorized)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject task retrieval without Bearer token (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/v1/tasks');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
