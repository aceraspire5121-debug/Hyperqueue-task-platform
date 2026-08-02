import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config';
import { logger } from '../utils/logger';

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public init(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || config.clientUrl === '*' || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
            return callback(null, true);
          }
          return callback(null, config.clientUrl);
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`🔌 Client connected to WebSockets: ${socket.id}`);

      socket.on('join_user_room', (userId: string) => {
        socket.join(`user:${userId}`);
        logger.info(`👤 Socket ${socket.id} joined user room: user:${userId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    logger.info('✅ WebSocket Server Initialized successfully');
  }

  public emitTaskUpdate(userId: string, taskData: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('task_status_updated', taskData);
      this.io.emit('global_task_updated', taskData); // Broadcast to Admin dashboard live view
    }
  }
}

export const webSocketService = WebSocketService.getInstance();
