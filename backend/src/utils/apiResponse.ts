import { Response } from 'express';

export interface ApiResponsePayload<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
  error?: any;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    meta?: any
  ): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
      meta,
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errorDetails?: any
  ): Response {
    const payload: ApiResponsePayload<null> = {
      success: false,
      message,
      error: errorDetails || null,
    };
    return res.status(statusCode).json(payload);
  }
}
