import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export function useSocket() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?._id) return;

    // Connect to websocket backend
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { userId: user._id },
    });

    socket.on('connect', () => {
      console.log('Connected to real-time notification service');
    });

    // Listen to real-time matching notifications from Dijkstra module
    socket.on('notification', (data) => {
      console.log('New Match Notification!', data);
      alert(`🔔 Spark Match! ${data.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);
}
