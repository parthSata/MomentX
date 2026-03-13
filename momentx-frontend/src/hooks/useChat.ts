import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

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
  const socket = useSocket();

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
            fetchChats().then(() => {
                window.dispatchEvent(new Event('chats_updated'));
            });
        } catch (error) {
            console.error('Fetch messages error', error);
        }
    }, [chatId, fetchChats]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    useEffect(() => {
        const handleSync = () => fetchChats();
        window.addEventListener('chats_updated', handleSync);
        return () => window.removeEventListener('chats_updated', handleSync);
    }, [fetchChats]);

    useEffect(() => {
        if (!user?._id || !socket) return;

        const handleNewMessage = (newMsg: Message) => {
            const senderId = typeof newMsg.sender === 'string' ? newMsg.sender : newMsg.sender?._id;
            if (senderId === user._id) return;

            if (chatId && newMsg.chatId === chatId) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === newMsg._id)) return prev;
                    return [...prev, newMsg];
                });
            }

            fetchChats().then(() => {
                window.dispatchEvent(new Event('chats_updated'));
            });
        };

        socket.on('newMessage', handleNewMessage);
        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [user?._id, chatId, fetchChats, socket]);

  // Send Message
  const sendMessage = async (
    receiverId: string,
    content: string,
    type: string = 'text',
  ) => {
    if (!user?._id) return;
    const body: any = { [type]: content };

    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: { 
        _id: user._id, 
        username: user.username, 
        profilePic: user.profilePic 
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      ...body,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const { data } = await api.post(`/chats/send/${receiverId}`, body);
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? data.data : m)),
      );
      return data.data;
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      throw error;
    }
  };

  // Delete Messages
  const deleteMessages = async (messageIds: string[]) => {
    if (!chatId) return;
    if (messageIds.length === 0) return;

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

  // ✅ CALCULATE TOTAL UNREAD MESSAGES GLOBALLY
  const totalUnreadMessages = chats.reduce(
    (sum, chat) => sum + (chat.unreadCount || 0),
    0,
  );

  return {
    chats,
    messages,
    loading,
    fetchChats,
    fetchMessages,
    sendMessage,
    deleteMessages,
    socket,
    totalUnreadMessages, // ✅ EXPORT THE TOTAL
  };
}
