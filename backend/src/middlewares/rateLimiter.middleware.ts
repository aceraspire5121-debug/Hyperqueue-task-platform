import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Explicitly track rate limits per User ID if logged in, or per IP Address if unauthenticated!
    return (req as any).user?.userId || req.ip || 'anonymous';
  },
  message: {
    success: false,
    message: 'Too many requests from this user account or IP, please try again later.',
  },
});
