import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://hyperqueue-task-platform.onrender.com';

let socket: Socket | null = null;

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 1,
  FAILED: 1,
  PROCESSING: 2,
  COMPLETED: 3,
};

export const useWebSocket = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
    }

    // Determine effective user ID (fallback to localStorage on client side if Redux is still loading)
    const getEffectiveUserId = (): string | undefined => {
      if (userId) return userId;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            return parsed.id || parsed._id;
          } catch (e) {
            return undefined;
          }
        }
      }
      return undefined;
    };

    const effectiveUserId = getEffectiveUserId();

    const joinRoom = () => {
      if (effectiveUserId && socket) {
        socket.emit('join_user_room', effectiveUserId);
      }
    };

    joinRoom();

    socket.on('connect', joinRoom);

    const handleTaskUpdate = (updatedTask: any) => {
      console.log('⚡ Live WebSocket Event Received:', updatedTask);
      if (!updatedTask || (!updatedTask._id && !updatedTask.id)) return;

      const targetId = String(updatedTask._id || updatedTask.id);

      // 1. Instant 0ms Direct React Query Cache Mutation (With Retry-Friendly Status Hierarchy Protection)
      queryClient.setQueriesData({ queryKey: ['tasks'], exact: false }, (oldData: any) => {
        if (!oldData || !oldData.tasks || !Array.isArray(oldData.tasks)) return oldData;

        // Handle Delete Event
        if (updatedTask.isDeleted) {
          return {
            ...oldData,
            tasks: oldData.tasks.filter((task: any) => String(task._id || task.id) !== targetId),
            total: Math.max(0, (oldData.total || 1) - 1),
          };
        }

        const exists = oldData.tasks.some((task: any) => String(task._id || task.id) === targetId);

        if (exists) {
          // Update existing task status with status hierarchy protection against out-of-order network packets
          return {
            ...oldData,
            tasks: oldData.tasks.map((task: any) => {
              if (String(task._id || task.id) === targetId) {
                const currentPriority = STATUS_PRIORITY[task.status] || 0;
                const newPriority = STATUS_PRIORITY[updatedTask.status] || 0;

                // Protect against out-of-order network packets: Never downgrade a terminal COMPLETED status, but allow retries from FAILED to PENDING/PROCESSING
                const safeStatus = (currentPriority >= 3 && newPriority < 3) ? task.status : updatedTask.status;

                return {
                  ...task,
                  ...updatedTask,
                  status: safeStatus,
                  completedAt: updatedTask.completedAt || task.completedAt,
                  failedReason: updatedTask.failedReason !== undefined ? updatedTask.failedReason : task.failedReason,
                  retries: updatedTask.retries !== undefined ? updatedTask.retries : task.retries,
                };
              }
              return task;
            }),
          };
        } else {
          // Prepend new created task to top of list!
          return {
            ...oldData,
            tasks: [updatedTask, ...oldData.tasks],
            total: (oldData.total || 0) + 1,
          };
        }
      });

      // 2. Invalidate metrics & audit logs gracefully without triggering blocking HTTP refetches on task list
      queryClient.invalidateQueries({ queryKey: ['metrics'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['task_logs'], exact: false });
    };

    socket.on('task_status_updated', handleTaskUpdate);
    socket.on('global_task_updated', handleTaskUpdate);

    return () => {
      if (socket) {
        socket.off('connect', joinRoom);
        socket.off('task_status_updated', handleTaskUpdate);
        socket.off('global_task_updated', handleTaskUpdate);
      }
    };
  }, [userId, queryClient]);
};
