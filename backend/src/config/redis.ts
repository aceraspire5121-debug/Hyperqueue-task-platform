import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  logger.info('✅ Connected to Redis Server successfully');
});

redisClient.on('error', (err) => {
  logger.error(`❌ Redis Connection Error: ${err.message}`);
});
