import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.success(res, 'User registered successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return ApiResponse.success(res, 'Login successful', result, 200);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      return ApiResponse.success(res, 'Tokens refreshed successfully', tokens, 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader ? authHeader.split(' ')[1] : undefined;
      const { refreshToken } = req.body;

      const result = await authService.logout(req.user!.userId, accessToken, refreshToken);
      return ApiResponse.success(res, 'Logged out successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }
}
