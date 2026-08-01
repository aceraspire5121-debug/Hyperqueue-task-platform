import http from 'http';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { webSocketService } from './websocket/socket';
import { initTaskWorker } from './queues/task.worker';

const server = http.createServer(app);

const startServer = async () => {
  // 1. Connect to MongoDB Database
  await connectDatabase();

  // 2. Initialize Socket.IO WebSockets
  webSocketService.init(server);

  // 3. Initialize BullMQ Async Worker
  const worker = initTaskWorker();

  server.listen(config.port, () => {
    logger.info(`🚀 Saarthi Task Backend Server running on port ${config.port} in [${config.nodeEnv}] mode`);
  });

  // Graceful Shutdown Handling
  const gracefulShutdown = async () => {
    logger.info('⚠️ Graceful shutdown initiated...');
    server.close(async () => {
      logger.info('HTTP server closed.');
      await worker.close();
      logger.info('BullMQ worker stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startServer();
