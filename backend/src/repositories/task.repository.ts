import { Task, ITask, TaskStatus, TaskPriority } from '../models/Task';
import { TaskLog, ITaskLog } from '../models/TaskLog';
import mongoose from 'mongoose';

export interface TaskFilterOptions {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  processingTasks: number;
}

export interface ITaskRepository {
  create(data: Partial<ITask>): Promise<ITask>;
  findById(id: string): Promise<ITask | null>;
  findMany(options: TaskFilterOptions): Promise<{ tasks: ITask[]; total: number; page: number; totalPages: number }>;
  update(id: string, data: Partial<ITask>): Promise<ITask | null>;
  delete(id: string): Promise<ITask | null>;
  addLog(taskId: string, status: TaskStatus, message: string, metadata?: Record<string, any>): Promise<ITaskLog>;
  getLogs(taskId: string): Promise<ITaskLog[]>;
  getMetrics(userId?: string): Promise<TaskMetrics>;
}

export class TaskRepository implements ITaskRepository {
  async create(data: Partial<ITask>): Promise<ITask> {
    const task = new Task(data);
    return task.save();
  }

  async findById(id: string): Promise<ITask | null> {
    return Task.findById(id).populate('createdBy', 'name email role');
  }

  async findMany(options: TaskFilterOptions) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options.createdBy) {
      query.createdBy = new mongoose.Types.ObjectId(options.createdBy);
    }

    if (options.status) {
      query.status = options.status;
    }

    if (options.priority) {
      query.priority = options.priority;
    }

    if (options.search) {
      query.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role'),
      Task.countDocuments(query),
    ]);

    return {
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: Partial<ITask>): Promise<ITask | null> {
    return Task.findByIdAndUpdate(id, data, { new: true }).populate('createdBy', 'name email role');
  }

  async delete(id: string): Promise<ITask | null> {
    const deletedTask=await Task.findByIdAndDelete(id);
    const deletedLogs=await TaskLog.deleteMany({taskId:id})
    return deletedTask;

  }


  async addLog(
    taskId: string,
    status: TaskStatus,
    message: string,
    metadata?: Record<string, any>
  ): Promise<ITaskLog> {
    const log = new TaskLog({
      taskId: new mongoose.Types.ObjectId(taskId),
      status,
      message,
      metadata,
    });
    return log.save();
  }

  async getLogs(taskId: string): Promise<ITaskLog[]> {
    return TaskLog.find({ taskId: new mongoose.Types.ObjectId(taskId) }).sort({ createdAt: -1, _id: -1 });
  }

  async getMetrics(userId?: string): Promise<TaskMetrics> {
    const matchStage: any = {};
    if (userId) {
      matchStage.createdBy = new mongoose.Types.ObjectId(userId);
    }

    const [totalTasks, completedTasks, failedTasks, pendingTasks, processingTasks] = await Promise.all([
      Task.countDocuments(matchStage),
      Task.countDocuments({ ...matchStage, status: TaskStatus.COMPLETED }),
      Task.countDocuments({ ...matchStage, status: TaskStatus.FAILED }),
      Task.countDocuments({ ...matchStage, status: TaskStatus.PENDING }),
      Task.countDocuments({ ...matchStage, status: TaskStatus.PROCESSING }),
    ]);

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      pendingTasks,
      processingTasks,
    };
  }
}
