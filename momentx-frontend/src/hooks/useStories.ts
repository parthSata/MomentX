import { useState, useEffect } from "react";
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

let socket: Socket;

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // Add this if missing

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

    // Connect to Backend URL
    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.emit("join_user_room", user._id);

    // Listen for Views
    socket.on(
      "story_view_updated",
      (data: { storyId: string; newViewer: any }) => {
        setStories((prevStories) => {
          // Create a new array to force re-render
          return prevStories.map((story) => {
            if (story._id === data.storyId) {
              // Check duplicates safely
              const exists = story.viewers?.some(
                (v) => v.user._id === data.newViewer.user._id
              );

              if (exists) {
                return story;
              }

              // Return new story object with updated viewers
              const updatedStory = {
                ...story,
                viewers: [data.newViewer, ...(story.viewers || [])],
              };

              return updatedStory;
            }
            return story;
          });
        });
      }
    );

    return () => {
      if (socket) socket.disconnect();
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
