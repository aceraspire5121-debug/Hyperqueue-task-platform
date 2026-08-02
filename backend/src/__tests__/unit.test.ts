import { describe, it, expect } from '@jest/globals';
import { createTaskSchema } from '../validators/task.validator';
import { AppError } from '../utils/appError';

describe('🧪 Core Business Logic Unit Tests', () => {
  it('should validate correctly with valid task payload (Zod Unit Test)', () => {
    const validData = {
      title: 'Valid Unit Test Task',
      description: 'Testing Zod Schema',
      priority: 'HIGH',
    };

    const parsed = createTaskSchema.parse(validData);
    expect(parsed.title).toBe('Valid Unit Test Task');
    expect(parsed.priority).toBe('HIGH');
  });

  it('should throw Zod error when task title is missing or empty (Zod Unit Test)', () => {
    const invalidData = {
      title: '',
    };

    expect(() => createTaskSchema.parse(invalidData)).toThrow();
  });

  it('should instantiate AppError with correct status code and message (AppError Unit Test)', () => {
    const err = new AppError('Unauthorized access test', 401);

    expect(err.message).toBe('Unauthorized access test');
    expect(err.statusCode).toBe(401);
    expect(err.isOperational).toBe(true);
  });
});
