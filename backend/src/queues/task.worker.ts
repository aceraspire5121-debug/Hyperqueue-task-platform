import { Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { TASK_QUEUE_NAME } from './task.queue';
import { TaskRepository } from '../repositories/task.repository';
import { TaskStatus } from '../models/Task';
import { webSocketService } from '../websocket/socket';
import { logger } from '../utils/logger';

const taskRepository = new TaskRepository();

export const initTaskWorker = () => {
  const worker = new Worker(
    TASK_QUEUE_NAME,
    async (job: Job) => {
      const { taskId, userId, title, payload } = job.data;
      logger.info(`⚙️ Processing Task [${taskId}] - Job ID: ${job.id}`);

      // 1. Update status to PROCESSING in MongoDB
      const processingTask = await taskRepository.update(taskId, {
        status: TaskStatus.PROCESSING,
      });

      // 2. Log event in TaskLog audit trail (File-Aware Logging!)
      let startMsg = `Task execution started (Attempt ${job.attemptsMade + 1})`;
      if (payload?.assetType === 'PDF') {
        startMsg = `Processing uploaded PDF document: ${payload.fileName} (${payload.fileSize})`;
      } else if (payload?.assetType === 'IMAGE') {
        startMsg = `Optimizing uploaded Image asset: ${payload.fileName} (${payload.fileSize})`;
      }

      await taskRepository.addLog(taskId, TaskStatus.PROCESSING, startMsg);

      // 3. Emit live WebSockets event to connected clients & invalidate metrics cache
      if (processingTask) {
        await redisClient.del(`metrics:${userId}`);
        await redisClient.del('metrics:admin');
        webSocketService.emitTaskUpdate(userId, processingTask);
      }

      // 4. Simulate Asynchronous Task Execution (Normal work = 4s, Fail demo = 1s)
      const workDuration = payload && (payload.simulateError || payload.failSimulated) ? 1000 : 4000;

      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // If payload contains simulateError = true, trigger error for retry demonstration
          if (payload && (payload.simulateError || payload.failSimulated)) {
            reject(new Error('Simulated worker processing error for retry demonstration'));
          } else {
            resolve(true);
          }
        }, workDuration);
      });

      // 5. Update status to COMPLETED with File-Aware completion logs
      let completionMsg = 'Task completed successfully';
      if (payload?.assetType === 'PDF') {
        completionMsg = `Extracted 4 pages & stored PDF asset in Cloudinary CDN (${payload.fileName})`;
      } else if (payload?.assetType === 'IMAGE') {
        completionMsg = `Compressed image by 64% & generated web thumbnail on Cloudinary CDN (${payload.fileName})`;
      }

      const completedTask = await taskRepository.update(taskId, {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });

      await taskRepository.addLog(taskId, TaskStatus.COMPLETED, completionMsg);

      // Emit live completion event via WebSocket & invalidate metrics cache
      if (completedTask) {
        await redisClient.del(`metrics:${userId}`);
        await redisClient.del('metrics:admin');
        webSocketService.emitTaskUpdate(userId, completedTask);
      }

      logger.info(`✅ Task [${taskId}] completed successfully`);
      return { success: true, taskId };
    },
    {
      connection: redisClient,
      concurrency: 5,
    }
  );

  worker.on('failed', async (job: Job | undefined, err: Error) => {
    if (!job) return;

    const { taskId, userId } = job.data;
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 3;

    logger.error(`❌ Task [${taskId}] failed on attempt ${attemptsMade}: ${err.message}`);

    if (attemptsMade >= maxAttempts) {
      // Mark permanently FAILED in MongoDB
      const failedTask = await taskRepository.update(taskId, {
        status: TaskStatus.FAILED,
        failedReason: err.message,
        retries: attemptsMade,
      });

      await taskRepository.addLog(
        taskId,
        TaskStatus.FAILED,
        `Task failed after ${attemptsMade} attempts: ${err.message}`
      );

      if (failedTask) {
        await redisClient.del(`metrics:${userId}`);
        await redisClient.del('metrics:admin');
        webSocketService.emitTaskUpdate(userId, failedTask);
      }
    } else {
      await taskRepository.addLog(
        taskId,
        TaskStatus.PROCESSING,
        `Attempt ${attemptsMade} failed: ${err.message}. Retrying...`
      );
    }
  });

  logger.info('🚀 BullMQ Worker Engine initialized and listening for jobs...');
  return worker;
};
