import { Queue } from 'bullmq';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export const TASK_QUEUE_NAME = 'hyperqueue_task_queue';

export const taskQueue = new Queue(TASK_QUEUE_NAME, {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s retries
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

logger.info(`✅ BullMQ Task Queue '${TASK_QUEUE_NAME}' initialized`);
