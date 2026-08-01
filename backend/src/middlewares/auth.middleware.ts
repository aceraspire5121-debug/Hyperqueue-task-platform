import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/appError';
import { TokenPayload } from '../types/express';
import { redisClient } from '../config/redis';

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing or invalid', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check if token has been blacklisted in Redis upon logout
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked/logged out', 401);
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired', 401));
    }
    return next(new AppError('Unauthorized access', 401));
  }
};
