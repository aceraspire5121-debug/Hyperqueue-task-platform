import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { AppError } from '../utils/appError';

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized access', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Forbidden: You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
