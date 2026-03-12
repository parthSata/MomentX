import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

// ✅ UPDATE INTERFACE
export interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' ;
  user: string; // Receiver ID
  sender: {
    _id: string;
    username: string;
    profilePic: string;
  };
  post?: {
    _id: string;
    images: string[];
  };
  reel?: {
    _id: string;
    videoUrl?: string;
    video?: string;
    thumbnail?: string;
    image?: string;
  };
  story?: {
    _id: string;
    url: string;
    type: 'image' | 'video';
  };
  comment?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // ✅ FIX 1: Use useRef to prevent connection overlap across Header/Sidebar/Page
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      const notifs = data.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ✅ FIX 2: Listen for cross-component updates (Syncs Sidebar & Header)
  useEffect(() => {
    const handleSync = () => fetchNotifications();
    window.addEventListener('notifications_updated', handleSync);
    return () =>
      window.removeEventListener('notifications_updated', handleSync);
  }, [fetchNotifications]);

  // Real-Time Listener
  useEffect(() => {
    if (!user?._id) return;

    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        withCredentials: true,
      });
    }

    const socket = socketRef.current;
    socket.emit('join_user_room', user._id);

    const handleNewNotification = (newNotif: Notification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [user?._id]);

  // Actions
  const markAllRead = async () => {
    try {
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      setNotifications(updated);
      setUnreadCount(0);
      await api.post('/notifications/read');

      // ✅ BROADCAST UPDATE TO SIDEBAR & HEADER
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const deleteNotification = async (id: string) => {
    const notifToDelete = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));

    if (notifToDelete && !notifToDelete.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
      // ✅ BROADCAST UPDATE
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (error) {
      console.error('Failed to delete notification', error);
      fetchNotifications();
    }
  };

  const deleteAllNotifications = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await api.delete('/notifications/all');
      // ✅ BROADCAST UPDATE
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (error) {
      console.error('Failed to delete all notifications', error);
      fetchNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    deleteNotification,
    deleteAllNotifications,
  };
}
