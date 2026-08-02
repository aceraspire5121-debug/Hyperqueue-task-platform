import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { rateLimiter } from './middlewares/rateLimiter.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import { ApiResponse } from './utils/apiResponse';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.clientUrl === '*' || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
        return callback(null, true);
      }
      return callback(null, config.clientUrl);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  return ApiResponse.success(res, 'HyperQueue Task Automation Backend Service Operational (MongoDB Stack)', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// API V1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
