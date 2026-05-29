import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export function useSocket() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?._id) return;

    // Connect to websocket backend
    const socket = io(import.meta.env.VITE_API_URL || '/', {
      query: { userId: user._id },
    });

    socket.on('connect', () => {
      console.log('Connected to real-time notification service with userId:', user._id);
    });

    // Listen to real-time matching notifications
    socket.on('notification', (data) => {
      console.log('New Match Notification!', data);
      
      // Dispatch custom window event so Dashboard knows to refresh automatically
      window.dispatchEvent(new CustomEvent('socket_notification_received', { detail: data }));
      
      // Visual feedback
      alert(`🔔 Campus P2P Alert!\n\n${data.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);
}

