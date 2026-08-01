import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let isRedisConnected = false;

const isUpstash = config.redis.host.includes('upstash.io');

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  tls: isUpstash ? { rejectUnauthorized: false } : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  isRedisConnected = true;
  logger.info('✅ Connected to Redis Server successfully');
});

redisClient.on('error', (err) => {
  if (!isRedisConnected) {
    logger.warn(`⚠️ Redis Connection Notice: ${err.message}`);
  }
});
