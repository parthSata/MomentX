import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { decryptMessage } from '@/lib/cryptoUtils';

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
  sharedPost?: any;
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
      // Refresh chat list so unread counts reflect server state
      fetchChats();
    } catch (error) {
      console.error('Fetch messages error', error);
    }
  }, [chatId, fetchChats]);

  // ── Optimistic read ──────────────────────────────────────────────────────────
  // Instantly zeroes unread count for a chat in this instance's local state,
  // and broadcasts a 'chat_read' CustomEvent so ALL other useChat instances
  // (Header, Sidebar nav, etc.) also zero instantly without an API round-trip.
  const markChatAsRead = useCallback((targetChatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        (c as any)._id === targetChatId ? { ...c, unreadCount: 0 } : c
      )
    );
    window.dispatchEvent(
      new CustomEvent('chat_read', { detail: { chatId: targetChatId } })
    );
  }, []);

  // Listen for 'chat_read' events dispatched by other useChat instances
  useEffect(() => {
    const handleChatRead = (e: Event) => {
      const targetChatId = (e as CustomEvent<{ chatId: string }>).detail?.chatId;
      if (!targetChatId) return;
      setChats((prev) =>
        prev.map((c) =>
          (c as any)._id === targetChatId ? { ...c, unreadCount: 0 } : c
        )
      );
    };
    window.addEventListener('chat_read', handleChatRead);
    return () => window.removeEventListener('chat_read', handleChatRead);
  }, []);

  // Initial load
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Real-time: new message received
  useEffect(() => {
    if (!user?._id || !socket) return;

    const handleNewMessage = (newMsg: any) => {
      const senderId =
        typeof newMsg.sender === 'string' ? newMsg.sender : newMsg.sender?._id;

      // chatId can be a string OR a MongoDB ObjectId object
      const msgChatId =
        typeof newMsg.chatId === 'object' && newMsg.chatId !== null
          ? String(newMsg.chatId._id || newMsg.chatId)
          : String(newMsg.chatId || '');

      // Decode text if encrypted
      const decodedText =
        newMsg.text && newMsg.text.startsWith('U2FsdGVkX1')
          ? decryptMessage(newMsg.text)
          : newMsg.text || '';

      const formattedMsg: Message = { ...newMsg, chatId: msgChatId, text: decodedText };

      // Update messages list if this chat is open
      if (chatId && msgChatId === String(chatId)) {
        setMessages((prev) => {
          // Already have this exact message (non-optimistic)
          if (prev.some((m) => !m.isOptimistic && String(m._id) === String(formattedMsg._id))) {
            return prev;
          }
          // If the sender is ME, replace the oldest optimistic message
          if (String(senderId) === String(user._id)) {
            const firstOptimisticIdx = prev.findIndex((m) => m.isOptimistic);
            if (firstOptimisticIdx !== -1) {
              const next = [...prev];
              next[firstOptimisticIdx] = { ...formattedMsg, isOptimistic: false };
              return next;
            }
            // No optimistic message to replace — check for duplicate before appending
            return prev.some((m) => String(m._id) === String(formattedMsg._id))
              ? prev
              : [...prev, formattedMsg];
          }
          // Other person's message — append
          return [...prev, formattedMsg];
        });
      }

      // Always refresh chat list sidebar
      fetchChats();
    };

    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [user?._id, chatId, socket, fetchChats]);

  // Send a message (optimistic)
  const sendMessage = async (
    receiverId: string,
    content: string,
    type: string = 'text',
  ) => {
    if (!user?._id) return;
    const body: any = { [type]: content };

    // Decode display text (content may be encrypted)
    const displayText =
      type === 'text'
        ? content.startsWith('U2FsdGVkX1')
          ? decryptMessage(content)
          : content
        : undefined;

    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: {
        _id: user._id,
        username: user.username,
        profilePic: user.profilePic,
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      ...body,
      // Show readable text in the bubble immediately
      ...(type === 'text' && { text: displayText }),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const { data } = await api.post(`/chats/send/${receiverId}`, body);
      // Replace optimistic msg with server response (keep decoded text)
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempMsg._id
            ? { ...data.data, text: displayText || data.data.text, isOptimistic: false }
            : m,
        ),
      );
      return data.data;
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      throw error;
    }
  };

  // Delete messages
  const deleteMessages = async (messageIds: string[]) => {
    if (!chatId || messageIds.length === 0) return;
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
    markChatAsRead,
    socket,
    totalUnreadMessages,
  };
}
