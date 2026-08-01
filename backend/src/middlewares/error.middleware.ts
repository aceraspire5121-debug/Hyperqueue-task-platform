import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.error(res, 'Validation error', 400, formattedErrors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiResponse.error(res, `Invalid resource ID format: ${err.value}`, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, `Duplicate field value entered for ${field}. Please use another value.`, 409);
  }

  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500
  );
};
