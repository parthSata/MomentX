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
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ FIX: Use ref for socket to persist across renders without re-initializing
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

  // ✅ REAL-TIME SOCKET LISTENER
  useEffect(() => {
    if (!user?._id) return;

    // 1. Initialize Socket (Using Port 3000 as requested)
    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    const socketInstance = socketRef.current;

    // 2. Connect
    socketInstance.on("connect", () => {
      // console.log("✅ Story Socket Connected:", socketInstance.id);
      socketInstance.emit("join_user_room", user._id);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Story Socket Error:", err.message);
    });

    // 3. Listen for Views
    socketInstance.on(
      "story_view_updated",
      (data: { storyId: string; newViewer: any }) => {
        // console.log("👁️ Story View Update Received:", data);

        setStories((prevStories) => {
          return prevStories.map((story) => {
            if (story._id === data.storyId) {
              // Check duplicates safely
              const exists = story.viewers?.some(
                (v) => v.user._id === data.newViewer.user._id
              );

              if (exists) return story;

              // Return new story object with updated viewers
              return {
                ...story,
                viewers: [data.newViewer, ...(story.viewers || [])],
              };
            }
            return story;
          });
        });
      }
    );

    // 4. Cleanup on Unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user?._id]);

  // Actions
  const addStoryToState = (newStories: Story[]) =>
    setStories((prev) => [...newStories, ...prev]);

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

  const deleteStory = async (storyId: string) => {
    try {
      await api.delete(`/stories/${storyId}`);
      setStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (error) {
      console.error("Failed to delete story", error);
    }
  };

  return {
    stories,
    loading,
    isUploading,
    setIsUploading,
    fetchStories,
    addStoryToState,
    markAsViewed,
    deleteStory,
  };
}
