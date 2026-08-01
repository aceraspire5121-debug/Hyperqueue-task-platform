import mongoose, { Schema, Document } from 'mongoose';
import { TaskStatus } from './Task';

export interface ITaskLog extends Document {
  taskId: mongoose.Types.ObjectId;
  status: TaskStatus;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const taskLogSchema = new Schema<ITaskLog>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const TaskLog = mongoose.model<ITaskLog>('TaskLog', taskLogSchema);
