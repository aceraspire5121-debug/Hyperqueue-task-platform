import http from 'http';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { webSocketService } from './websocket/socket';
import { initTaskWorker } from './queues/task.worker';

import { User, UserRole } from './models/User';
import { Task, TaskStatus, TaskPriority } from './models/Task';
import { TaskLog } from './models/TaskLog';
import bcrypt from 'bcrypt';

const server = http.createServer(app);

const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('🌱 Fresh Database Detected. Running Automatic Seeding...');

      const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
      const admin = await User.create({
        email: 'admin@hyperqueue.io',
        name: 'System Admin',
        password: adminPasswordHash,
        role: UserRole.ADMIN,
      });

      const userPasswordHash = await bcrypt.hash('UserPassword123!', 10);
      const demoUser = await User.create({
        email: 'user@hyperqueue.io',
        name: 'Demo Developer',
        password: userPasswordHash,
        role: UserRole.USER,
      });

      const sampleTasks = [
        {
          title: 'Database Backup Pipeline',
          description: 'Automated nightly MongoDB dump to S3 storage bucket.',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          createdBy: demoUser._id,
          completedAt: new Date(),
        },
        {
          title: 'Email Notification Batch',
          description: 'Send weekly analytics digest to subscribers via SendGrid API.',
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          createdBy: demoUser._id,
        },
        {
          title: 'PDF Report Generation',
          description: 'Generate monthly financial statement PDF with charts.',
          status: TaskStatus.PROCESSING,
          priority: TaskPriority.URGENT,
          createdBy: demoUser._id,
        },
        {
          title: 'Third-Party Webhook Sync',
          description: 'Sync order events with external inventory ERP system.',
          status: TaskStatus.FAILED,
          priority: TaskPriority.MEDIUM,
          failedReason: 'Connection timeout (ETIMEDOUT) to ERP endpoint',
          retries: 3,
          createdBy: demoUser._id,
        },
      ];

      for (const taskData of sampleTasks) {
        const task = await Task.create(taskData);
        await TaskLog.create({
          taskId: task._id,
          status: task.status,
          message: `Task seeded with initial status: ${task.status}`,
        });
      }

      logger.info('✅ Automatic Database Seeding Complete! Demo User (user@hyperqueue.io / UserPassword123!) and Admin (admin@hyperqueue.io) are ready.');
    }
  } catch (err: any) {
    logger.error(`Failed to auto-seed database: ${err.message}`);
  }
};

const startServer = async () => {
  // 1. Connect to MongoDB Database
  await connectDatabase();

  // 2. Auto-seed if database is empty (e.g. fresh Docker container)
  await autoSeedIfEmpty();

  // 2. Initialize Socket.IO WebSockets
  webSocketService.init(server);

  // 3. Initialize BullMQ Async Worker
  const worker = initTaskWorker();

  server.listen(config.port, () => {
    logger.info(`🚀 HyperQueue Task Backend Server running on port ${config.port} in [${config.nodeEnv}] mode`);
  });

  // Graceful Shutdown Handling
  const gracefulShutdown = async () => {
    logger.info('⚠️ Graceful shutdown initiated...');
    server.close(async () => {
      logger.info('HTTP server closed.');
      await worker.close();
      logger.info('BullMQ worker stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startServer();
