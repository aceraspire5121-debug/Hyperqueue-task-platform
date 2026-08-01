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

      // 2. Log event in TaskLog audit trail
      await taskRepository.addLog(
        taskId,
        TaskStatus.PROCESSING,
        `Task execution started (Attempt ${job.attemptsMade + 1})`
      );

      // 3. Emit live WebSockets event to connected clients
      if (processingTask) {
        webSocketService.emitTaskUpdate(userId, processingTask);
      }

      // 4. Simulate Asynchronous Task Execution (e.g. PDF generation, API sync)
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // If payload contains failSimulated = true, trigger error for retry demonstration
          if (payload && payload.failSimulated && job.attemptsMade < 1) {
            reject(new Error('Simulated worker processing error for retry demonstration'));
          } else {
            resolve(true);
          }
        }, 4000); // 4 seconds work simulation
      });

      // 5. Update status to COMPLETED
      const completedTask = await taskRepository.update(taskId, {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });

      await taskRepository.addLog(
        taskId,
        TaskStatus.COMPLETED,
        'Task completed successfully'
      );

      // Emit live completion event via WebSocket
      if (completedTask) {
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
