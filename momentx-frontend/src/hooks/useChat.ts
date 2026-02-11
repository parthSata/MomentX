import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

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

  const fetchChats = useCallback(async () => {
    try {
      const { data } = await api.get('/chats');
      setChats(data.data || []);
    } catch (error) {
      console.error('Fetch chats error', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const { data } = await api.get(`/chats/${chatId}/messages`);
      setMessages(data.data || []);
    } catch (error) {
      console.error('Fetch messages error', error);
    }
  }, [chatId]);

  // 3. Socket Logic (THE FIX IS HERE)
  useEffect(() => {
    if (!user?._id) return;
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000', {
        transports: ['websocket'],
        withCredentials: true,
      });
    }

    const socket = socketRef.current;
    const onConnect = () => socket.emit('join_user_room', user._id);

    const handleNewMessage = (newMsg: Message) => {
      // ✅ Only add if it's not from us (Optimistic handles ours)
      const senderId =
        typeof newMsg.sender === 'string' ? newMsg.sender : newMsg.sender?._id;
      if (senderId === user._id) return;

      if (chatId && newMsg.chatId === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
      fetchChats();
    };

    socket.on('connect', onConnect);
    socket.on('newMessage', handleNewMessage);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('newMessage', handleNewMessage);
    };
  }, [user?._id, chatId, fetchChats]);

  // 4. Send Message
  const sendMessage = async (
    receiverId: string,
    content: string,
    type: string = 'text',
  ) => {
    if (!user?._id) return;
    const body: any = { [type]: content };

    // ✅ FIX: Use full ISO string to prevent "Invalid Date"
    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      ...body,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const { data } = await api.post(`/chats/send/${receiverId}`, body);
      // ✅ Update message ID from temp to real
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? data.data : m)),
      );
      return data.data;
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      throw error;
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
      await api.post('/chats/delete-messages', { chatId, messageIds });
    } catch (error: any) {
      console.error('Delete Failed:', error);
      setMessages(originalMessages);
      alert('Could not delete messages.');
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
