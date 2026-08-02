import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://hyperqueue-task-platform.onrender.com';

let socket: Socket | null = null;

export const useWebSocket = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
    }

    const joinRoom = () => {
      if (userId && socket) {
        socket.emit('join_user_room', userId);
      }
    };

    joinRoom();

    socket.on('connect', joinRoom);

    const handleTaskUpdate = (updatedTask: any) => {
      console.log('⚡ Live WebSocket Event Received:', updatedTask);
      if (!updatedTask || (!updatedTask._id && !updatedTask.id)) return;

      const targetId = String(updatedTask._id || updatedTask.id);

      // 1. Instant 0ms Direct React Query Cache Mutation (Handles Update, Delete, & New Creation)
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
          // Update existing task status
          return {
            ...oldData,
            tasks: oldData.tasks.map((task: any) => {
              if (String(task._id || task.id) === targetId) {
                return {
                  ...task,
                  ...updatedTask,
                  status: updatedTask.status,
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

      // 2. Immediate refetch active queries to ensure backend consistency
      queryClient.refetchQueries({ queryKey: ['tasks'], exact: false, type: 'active' });
      queryClient.refetchQueries({ queryKey: ['metrics'], exact: false, type: 'active' });
      queryClient.refetchQueries({ queryKey: ['task_logs'], exact: false, type: 'active' });
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
