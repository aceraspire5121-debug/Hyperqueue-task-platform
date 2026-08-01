import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from './config';
import { User, UserRole } from './models/User';
import { Task, TaskStatus, TaskPriority } from './models/Task';
import { TaskLog } from './models/TaskLog';
import { logger } from './utils/logger';

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('🌱 Starting Database Seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    await TaskLog.deleteMany({});

    // 1. Create Admin User
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await User.create({
      email: 'admin@saarthi.ai',
      name: 'System Admin',
      password: adminPasswordHash,
      role: UserRole.ADMIN,
    });

    // 2. Create Regular Demo User
    const userPasswordHash = await bcrypt.hash('UserPassword123!', 10);
    const demoUser = await User.create({
      email: 'user@saarthi.ai',
      name: 'Demo Developer',
      password: userPasswordHash,
      role: UserRole.USER,
    });

    logger.info('👤 Admin (admin@saarthi.ai) & Demo User (user@saarthi.ai) created.');

    // 3. Create Sample Tasks
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

    logger.info('📋 Sample Tasks & Logs Seeded Successfully.');
    logger.info('✅ Database Seeding Completed!');
    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Database Seeding Failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
