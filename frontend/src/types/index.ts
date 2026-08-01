export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduledAt?: string;
  completedAt?: string;
  retries: number;
  maxRetries: number;
  failedReason?: string;
  payload?: any;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskLog {
  _id: string;
  taskId: string;
  status: TaskStatus;
  message: string;
  metadata?: any;
  createdAt: string;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  processingTasks: number;
}
