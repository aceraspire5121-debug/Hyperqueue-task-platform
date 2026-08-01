import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const useWebSocket = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        withCredentials: true,
      });
    }

    if (userId && socket) {
      socket.emit('join_user_room', userId);
    }

    const handleTaskUpdate = (updatedTask: any) => {
      // Invalidate TanStack Query cache so UI re-renders with live data instantly!
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    };

    socket.on('task_status_updated', handleTaskUpdate);
    socket.on('global_task_updated', handleTaskUpdate);

    return () => {
      if (socket) {
        socket.off('task_status_updated', handleTaskUpdate);
        socket.off('global_task_updated', handleTaskUpdate);
      }
    };
  }, [userId, queryClient]);
};
