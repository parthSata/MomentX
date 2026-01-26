import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/axios";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

export interface ChatUser {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  isOnline: boolean;
}

export interface Chat {
  _id: string;
  user: ChatUser;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
}

export interface Message {
  _id: string;
  chatId?: string;
  sender: { _id: string; username?: string; profilePic?: string };
  text?: string;
  image?: string;
  video?: string;
  audio?: string;
  createdAt: string;
  isOptimistic?: boolean;
}

export function useChat(chatId?: string) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch Chats
  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats");
      setChats(data.data || []);
    } catch (error) {
      console.error("Fetch chats error", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Messages
  const fetchMessages = async () => {
    if (!chatId) return;
    try {
      const { data } = await api.get(`/chats/${chatId}/messages`);
      setMessages(data.data || []);
    } catch (error) {
      console.error("Fetch messages error", error);
    }
  };

  // 3. Socket Logic (THE FIX IS HERE)
  useEffect(() => {
    if (!user?._id) return;

    // Initialize Socket if null
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:3000", {
        transports: ["websocket"],
        withCredentials: true,
        autoConnect: false, // We handle connection manually
      });
    }

    const socket = socketRef.current;

    // ✅ FIX: Handler to join room on EVERY connection/reconnection
    const onConnect = () => {
      socket.emit("join_user_room", user._id);
    };

    const onDisconnect = () => {
      console.log("⚠️ Socket Disconnected");
    };

    const handleNewMessage = (newMsg: Message) => {
      // If we are currently in this chat, add to messages list
      if (chatId && newMsg.chatId === chatId) {
        setMessages((prev) => [...prev, newMsg]);
      }

      // Always update the Chat List preview
      setChats((prev) => {
        return prev
          .map((c) =>
            c._id === newMsg.chatId
              ? {
                  ...c,
                  lastMessage: newMsg.text || "Sent a file",
                  lastMessageAt: newMsg.createdAt,
                }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime()
          );
      });
    };

    // Attach Listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("newMessage", handleNewMessage);

    // Manual Connect Trigger
    if (!socket.connected) {
      socket.connect();
    } else {
      // If already connected (e.g. from previous page), we MUST still join the room
      onConnect();
    }

    // Cleanup Listeners (Prevents duplicates)
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("newMessage", handleNewMessage);
      // Note: We do NOT disconnect the socket here to keep it alive across navigation
    };
  }, [user?._id, chatId]);

  // 4. Send Message
  const sendMessage = async (
    receiverId: string,
    content: string,
    type: "text" | "image" | "video" | "audio" = "text"
  ) => {
    if (!user?._id) return;

    const body: any = {};
    if (type === "text") body.text = content;
    else if (type === "image") body.image = content;
    else if (type === "video") body.video = content;
    else if (type === "audio") body.audio = content;

    // Optimistic UI Update
    const tempMsg: Message = {
      _id: Date.now().toString(),
      sender: { _id: user._id },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      ...body,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      await api.post(`/chats/send/${receiverId}`, body);
      // Don't need to do anything else, socket will confirm it or it's saved.
    } catch (error) {
      console.error("Send error", error);
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    }
  };

  // 5. Delete Messages
  const deleteMessages = async (messageIds: string[]) => {
    if (!chatId) return;
    if (messageIds.length === 0) return;

    // Optimistic UI
    const originalMessages = [...messages];
    setMessages((prev) => prev.filter((msg) => !messageIds.includes(msg._id)));

    try {
      await api.post("/chats/delete-messages", { chatId, messageIds });
    } catch (error: any) {
      console.error("Delete Failed:", error);
      setMessages(originalMessages);
      alert("Could not delete messages.");
    }
  };

  return {
    chats,
    messages,
    loading,
    fetchChats,
    fetchMessages,
    sendMessage,
    deleteMessages,
    socketRef,
  };
}
