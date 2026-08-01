import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../models/Task';

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters long'),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  scheduledAt: z.string().datetime().optional().nullable(),
  maxRetries: z.number().int().min(0).max(10).optional().default(3),
  payload: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      }
      return val;
    }, z.record(z.any()))
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  payload: z.record(z.any()).optional(),
});

export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  page: z.string().transform(val => parseInt(val, 10)).optional().default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).optional().default('10'),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
