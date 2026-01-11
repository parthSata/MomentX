import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

export interface Notification {
  _id: string;
  type: "like" | "comment" | "follow";
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
  comment?: string;
  isRead: boolean;
  createdAt: string;
}

let socket: Socket;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // 1. Initial Fetch
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      const notifs = data.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 2. Real-Time Listener
  useEffect(() => {
    if (!user?._id) return;

    socket = io("http://localhost:3000"); // Ensure port matches Backend
    socket.emit("join_user_room", user._id);

    socket.on("new_notification", (newNotif: Notification) => {
      console.log("🔔 New Notification:", newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user?._id]);

  // 3. Actions
  const markAllRead = async () => {
    try {
      // Optimistic UI update
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      setNotifications(updated);
      setUnreadCount(0);

      // Backend call
      await api.post("/notifications/read");
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead,
  };
}
