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
      if (!updatedTask || (!updatedTask._id && !updatedTask.id)) return;

      const targetId = updatedTask._id || updatedTask.id;

      // 1. Instant 0ms Direct React Query Cache Mutation
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (oldData: any) => {
        if (!oldData || !oldData.tasks || !Array.isArray(oldData.tasks)) return oldData;

        // Handle Delete Event (Remove Row Instant 0ms)
        if (updatedTask.isDeleted) {
          return {
            ...oldData,
            tasks: oldData.tasks.filter((task: any) => (task._id || task.id) !== targetId),
            total: Math.max(0, (oldData.total || 1) - 1),
          };
        }

        // Handle Status / Details Update Event
        return {
          ...oldData,
          tasks: oldData.tasks.map((task: any) => {
            const taskId = task._id || task.id;
            if (taskId === targetId) {
              return {
                ...task,
                ...updatedTask,
                completedAt: updatedTask.completedAt || task.completedAt,
                failedReason: updatedTask.failedReason || task.failedReason,
                retries: updatedTask.retries !== undefined ? updatedTask.retries : task.retries,
              };
            }
            return task;
          }),
        };
      });

      // 2. Pure TanStack Query Background Refetch (Sync Data)
      queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['metrics'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['task_logs'], refetchType: 'all' });
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
