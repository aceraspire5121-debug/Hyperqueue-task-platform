import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { ApiResponse } from '../utils/apiResponse';
import { TaskStatus, TaskPriority } from '../models/Task';
import { cloudinaryService } from '../services/cloudinary.service';

const taskService = new TaskService();

export class TaskController {
  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      let bodyData = { ...req.body };
      
      // Parse body payload if sent as stringified JSON in multipart/form-data
      if (typeof bodyData.payload === 'string') {
        try {
          bodyData.payload = JSON.parse(bodyData.payload);
        } catch (e) {
          bodyData.payload = {};
        }
      }

      let payloadObj = bodyData.payload || {};

      // ☁️ REAL CLOUDINARY UPLOAD PIPELINE: Upload raw File Buffer to user's Cloudinary CDN!
      if (req.file) {
        const uploaded = await cloudinaryService.uploadBuffer(req.file.buffer, req.file.originalname);
        
        payloadObj = {
          ...payloadObj,
          assetType: req.file.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE',
          fileName: req.file.originalname,
          fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
          fileUrl: uploaded.url, // 👈 REAL CLOUDINARY HTTPS CDN URL!
        };
      }

      bodyData.payload = payloadObj;

      const task = await taskService.createTask(req.user!.userId, bodyData);
      return ApiResponse.success(res, 'Task created and queued successfully', task, 201);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, priority, page, limit, sortBy, sortOrder } = req.query as any;

      const result = await taskService.getTasks(
        req.user!.userId,
        req.user!.role,
        {
          search: search as string,
          status: status as TaskStatus,
          priority: priority as TaskPriority,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 10,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      return ApiResponse.success(res, 'Tasks retrieved successfully', result.tasks, 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taskService.getTaskById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      return ApiResponse.success(res, 'Task details retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.updateTask(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        req.body
      );
      return ApiResponse.success(res, 'Task updated successfully', task, 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taskService.deleteTask(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      return ApiResponse.success(res, 'Task deleted successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  async retryTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.retryTask(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      return ApiResponse.success(res, 'Task re-queued for execution', task, 200);
    } catch (error) {
      next(error);
    }
  }

  async getTaskLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taskService.getTaskById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      return ApiResponse.success(res, 'Task audit logs retrieved', result.logs, 200);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await taskService.getDashboardMetrics(
        req.user!.userId,
        req.user!.role
      );
      return ApiResponse.success(res, 'Dashboard metrics fetched successfully', metrics, 200);
    } catch (error) {
      next(error);
    }
  }
}
