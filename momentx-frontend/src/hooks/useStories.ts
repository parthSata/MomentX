import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/axios";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

export interface StoryUser {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
  profilePic?: string;
}

export interface StoryViewer {
  user: StoryUser;
  viewedAt: string;
}

export interface Story {
  _id: string;
  user: StoryUser;
  url: string;
  type: "image" | "video";
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
      const { data } = await api.get("/stories");
      setStories(data.data || []);
    } catch (error) {
      console.error("Failed to fetch stories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Socket Connection
  useEffect(() => {
    if (!user?._id) return;
    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    const socketInstance = socketRef.current;

    socketInstance.on("connect", () => {
      socketInstance.emit("join_user_room", user._id);
    });

    socketInstance.on(
      "story_view_updated",
      (data: { storyId: string; newViewer: any }) => {
        setStories((prev) =>
          prev.map((story) => {
            if (story._id === data.storyId) {
              const exists = story.viewers?.some(
                (v) => v.user._id === data.newViewer.user._id
              );
              if (exists) return story;
              return {
                ...story,
                viewers: [data.newViewer, ...(story.viewers || [])],
              };
            }
            return story;
          })
        );
      }
    );

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [user?._id]);

  const markAsViewed = async (storyId: string) => {
    try {
      await api.post(`/stories/${storyId}/view`);
      setStories((prev) =>
        prev.map((s) => (s._id === storyId ? { ...s, isViewed: true } : s))
      );
    } catch (error) {
      console.error("Failed to mark story as viewed", error);
    }
  };

  const likeStory = async (storyId: string) => {
    // 1. Optimistic Update (Prevent UI lag)
    setStories((prevStories) =>
      prevStories.map((story) => {
        if (story._id === storyId) {
          // IMPORTANT: Spread ...story first to keep 'user', 'url', etc.
          return {
            ...story,
            isLiked: !story.isLiked,
            // Visually update the likes array (optional but good for consistency)
            likes: story.isLiked
              ? (story.likes || []).filter((id) => id !== user?._id)
              : [...(story.likes || []), user?._id || "me"],
          };
        }
        return story;
      })
    );

    try {
      // 2. API Call
      await api.post(`/stories/${storyId}/like`);
    } catch (error) {
      console.error("Failed to like story", error);
      fetchStories(); // Revert on error
    }
  };

  const replyStory = async (storyId: string, message: string) => {
    try {
      await api.post(`/stories/${storyId}/reply`, { message });
    } catch (error) {
      console.error("Reply error", error);
      throw error;
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      await api.delete(`/stories/${storyId}`);
      setStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (error) {
      console.error("Failed to delete story", error);
    }
  };

  // ✅ ADDED: createStory function used in other parts of app
  const createStory = async (files: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const { data } = await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        setStories((prev) => [...data.data, ...prev]);
      }
      return data;
    } catch (error) {
      console.error("Upload failed", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    stories,
    loading,
    isUploading,
    setIsUploading,
    fetchStories,
    addStoryToState: setStories,
    markAsViewed,
    deleteStory,
    likeStory,
    replyStory,
    createStory, // ✅ Fixed: Now exported
  };
}
