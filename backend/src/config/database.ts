import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    logger.info(`🍃 MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error: any) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
