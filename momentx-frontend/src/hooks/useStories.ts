import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

export interface StoryUser {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  profilePic?: string;
}

export interface StoryViewer {
  user: StoryUser;
  viewedAt: string;
}

export interface Story {
  _id: string;
  user: StoryUser | string;
  url: string;
  type: 'image' | 'video';
  isViewed: boolean;
  createdAt: string;
  viewers?: StoryViewer[];
  isLiked?: boolean;
  likes?: string[];
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  const fetchStories = async () => {
    try {
      const { data } = await api.get('/stories');
      setStories(data.data || []);
    } catch (error) {
      console.error('Failed to fetch stories', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Socket connection
  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      socket.emit('join_user_room', user._id);
    });

    socket.on(
      'story_view_updated',
      (data: { storyId: string; newViewer: StoryViewer }) => {
        setStories((prev) =>
          prev.map((story) => {
            if (story._id === data.storyId) {
              const exists = story.viewers?.some(
                (v) => v.user._id === data.newViewer.user._id,
              );
              if (exists) return story;
              return {
                ...story,
                viewers: [...(story.viewers || []), data.newViewer],
              };
            }
            return story;
          }),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  const markAsViewed = async (storyId: string) => {
    try {
      await api.post(`/stories/${storyId}/view`);
      setStories((prev) =>
        prev.map((s) => (s._id === storyId ? { ...s, isViewed: true } : s)),
      );
    } catch (error) {
      console.error('Failed to mark story as viewed', error);
    }
  };

  const likeStory = async (storyId: string) => {
    // Optimistic update
    setStories((prev) =>
      prev.map((story) => {
        if (story._id === storyId) {
          const currentlyLiked = story.isLiked ?? false;
          const currentLikes = story.likes || [];

          return {
            ...story,
            isLiked: !currentlyLiked,
            likes: currentlyLiked
              ? currentLikes.filter((id) => id !== user?._id)
              : [...currentLikes, user?._id || ''],
          };
        }
        return story;
      }),
    );

    try {
      await api.post(`/stories/${storyId}/like`);
    } catch (error) {
      console.error('Like failed', error);
      // Revert optimistic update on error
      fetchStories();
    }
  };

  const replyStory = async (storyId: string, message: string) => {
    try {
      const { data } = await api.post(`/stories/${storyId}/reply`, { message });
      return {
        success: data.success,
        chatId: data.chatId,
      };
    } catch (error) {
      console.error('Reply error', error);
      throw error;
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      await api.delete(`/stories/${storyId}`);
      setStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (error) {
      console.error('Failed to delete story', error);
    }
  };

  const createStory = async (files: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const { data } = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success && data.data) {
        setStories((prev) => [...data.data, ...prev]);
      }

      return data;
    } catch (error) {
      console.error('Upload failed', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    stories,
    loading,
    isUploading,
    fetchStories,
    markAsViewed,
    likeStory,
    replyStory,
    deleteStory,
    createStory,
  };
}
