import { useState, useEffect } from "react";
import { api } from "@/lib/axios";

export interface StoryUser {
  _id: string; // ✅ Added _id to fix type error
  username: string;
  displayName: string;
  avatar: string;
}

export interface Story {
  _id: string;
  user: StoryUser;
  url: string;
  type: "image" | "video";
  isViewed: boolean;
  createdAt: string;
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const createStory = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file); // Multer looks for "file" field

    try {
      // No change needed here, just ensuring headers are correct
      const { data } = await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStories((prev) => [data.data, ...prev]);
    } catch (error) {
      console.error("Failed to upload story", error);
    } finally {
      setIsUploading(false);
    }
  };  

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

  // ✅ New function to handle deletion
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
    createStory,
    markAsViewed,
    deleteStory, // ✅ Exported here
  };
}
