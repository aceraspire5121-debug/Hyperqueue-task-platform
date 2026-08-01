import { TaskRepository, TaskFilterOptions } from '../repositories/task.repository';
import { taskQueue } from '../queues/task.queue';
import { AppError } from '../utils/appError';
import { TaskStatus, TaskPriority } from '../models/Task';
import { UserRole } from '../models/User';
import { redisClient } from '../config/redis';
import mongoose from 'mongoose';

const taskRepository = new TaskRepository();

export class TaskService {
  async createTask(
    userId: string,
    data: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      scheduledAt?: string | null;
      maxRetries?: number;
      payload?: any;
    }
  ) {
    const scheduledDate = data.scheduledAt ? new Date(data.scheduledAt) : undefined;

    // 1. Create Task document in MongoDB
    const task = await taskRepository.create({
      title: data.title,
      description: data.description,
      priority: data.priority || TaskPriority.MEDIUM,
      scheduledAt: scheduledDate,
      maxRetries: data.maxRetries ?? 3,
      payload: data.payload,
      createdBy: new mongoose.Types.ObjectId(userId),
      status: TaskStatus.PENDING,
    });

    // 2. Add log to TaskLog audit trail
    await taskRepository.addLog(task._id.toString(), TaskStatus.PENDING, 'Task created and added to queue');

    // 3. Queue job in BullMQ
    const delay = scheduledDate ? Math.max(0, scheduledDate.getTime() - Date.now()) : 0; //agar future time hai to kitne miliseconds 
    //baad tasks ka execution start karna hai bahi delay hai

    await taskQueue.add(
      'process_task',
      {
        taskId: task._id.toString(),
        userId: userId,
        title: task.title,
        payload: task.payload,
      },
      {
        delay,
        attempts: task.maxRetries,
      }
    );

    // Invalidate Redis metrics cache
    await redisClient.del(`metrics:${userId}`);
    await redisClient.del('metrics:admin');

    return task;
  }

  async getTasks(userId: string, userRole: UserRole, options: TaskFilterOptions) {
    // Regular users can only see their own tasks. Admins can see all tasks.
    if (userRole !== UserRole.ADMIN) {
      options.createdBy = userId;
    }

    return taskRepository.findMany(options);
  }

  async getTaskById(taskId: string, userId: string, userRole: UserRole) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const taskOwnerId = (task.createdBy as any)._id ? (task.createdBy as any)._id.toString() : task.createdBy.toString();

    if (userRole !== UserRole.ADMIN && taskOwnerId !== userId) {
      throw new AppError('Access denied', 403);
    }

    const logs = await taskRepository.getLogs(taskId);

    return {
      task,
      logs,
    };
  }

  async updateTask(
    taskId: string,
    userId: string,
    userRole: UserRole,
    data: Partial<any>
  ) {
    const existingTask = await taskRepository.findById(taskId);

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const taskOwnerId = (existingTask.createdBy as any)._id ? (existingTask.createdBy as any)._id.toString() : existingTask.createdBy.toString();

    if (userRole !== UserRole.ADMIN && taskOwnerId !== userId) {
      throw new AppError('Access denied', 403);
    }

    const updatedTask = await taskRepository.update(taskId, data);
    await redisClient.del(`metrics:${userId}`);
    await redisClient.del('metrics:admin');
    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string, userRole: UserRole) {
    const existingTask = await taskRepository.findById(taskId);

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const taskOwnerId = (existingTask.createdBy as any)._id ? (existingTask.createdBy as any)._id.toString() : existingTask.createdBy.toString();

    if (userRole !== UserRole.ADMIN && taskOwnerId !== userId) {
      throw new AppError('Access denied', 403);
    }

    await taskRepository.delete(taskId);
    await redisClient.del(`metrics:${userId}`);
    await redisClient.del('metrics:admin');
    return { message: 'Task deleted successfully' };
  }

  async retryTask(taskId: string, userId: string, userRole: UserRole) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const taskOwnerId = (task.createdBy as any)._id ? (task.createdBy as any)._id.toString() : task.createdBy.toString();

    if (userRole !== UserRole.ADMIN && taskOwnerId !== userId) {
      throw new AppError('Access denied', 403);
    }

    if (task.status !== TaskStatus.FAILED) {
      throw new AppError('Only FAILED tasks can be retried', 400);
    }

    // Clear simulated error flag so manual retry succeeds!
    const cleanPayload = { ...task.payload, simulateError: false, failSimulated: false };

    // Reset status to PENDING and clear failedReason
    const updatedTask = await taskRepository.update(taskId, {
      status: TaskStatus.PENDING,
      failedReason: '',
      retries: 0,
      payload: cleanPayload,
    } as any);

    await taskRepository.addLog(taskId, TaskStatus.PENDING, 'Task retry initiated by user');

    // Re-queue in BullMQ
    await taskQueue.add(
      'process_task',
      {
        taskId: task._id.toString(),
        userId: taskOwnerId,
        title: task.title,
        payload: cleanPayload,
      },
      {
        attempts: task.maxRetries,
      }
    );

    await redisClient.del(`metrics:${userId}`);
    await redisClient.del('metrics:admin');

    return updatedTask;
  }

  async getDashboardMetrics(userId: string, userRole: UserRole) {
    const cacheKey = userRole === UserRole.ADMIN ? 'metrics:admin' : `metrics:${userId}`;

    // Redis Caching for frequently accessed Dashboard APIs (Assessment Requirement)
    const cachedMetrics = await redisClient.get(cacheKey);
    if (cachedMetrics) {
      return JSON.parse(cachedMetrics);
    }

    const metrics = await taskRepository.getMetrics(
      userRole === UserRole.ADMIN ? undefined : userId
    );

    // Cache metrics in Redis for 30 seconds
    await redisClient.set(cacheKey, JSON.stringify(metrics), 'EX', 30);

    return metrics;
  }
}
