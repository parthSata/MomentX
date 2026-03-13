import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { api } from "@/lib/axios"
import { toast } from "sonner"
import type { Story } from "@/hooks/useStories"
import { StoryUploadDialog } from "./StoryUploadDialog"

interface StoriesBarProps {
  stories: Story[];
  onStoryClick: (storyId: string) => void;
  onFileSelect?: (file: File) => void;
  currentUser: any;
  onUploadSuccess?: () => void;
}

export function StoriesBar({
  stories,
  onStoryClick,
  currentUser,
  onUploadSuccess
}: StoriesBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const safeStories = Array.isArray(stories) ? stories : [];

  const getUserId = (user: any) => {
    if (!user) return "";
    return typeof user === 'object' ? user._id?.toString() : user.toString();
  }

  const getUserAvatar = (user: any) => {
    return user?.avatar || user?.profilePic || "/image.png";
  }

  // ✅ New helper to safely extract username without TS errors
  const getUserName = (user: any) => {
    if (typeof user === 'object' && user?.username) {
      return user.username;
    }
    return "User";
  }

  const currentUserId = getUserId(currentUser);
  const myStory = safeStories.find(s => getUserId(s.user) === currentUserId);
  const otherStories = safeStories.filter(s => getUserId(s.user) !== currentUserId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setIsDialogOpen(true)
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleUploadConfirm = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("files", selectedFile);

    try {
      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const current = progressEvent.loaded;
          const percentage = Math.round((current / total) * 100);
          setUploadProgress(percentage);
        },
      });

      toast.success("Story uploaded successfully!");
      setIsDialogOpen(false);
      setSelectedFile(null);

      if (onUploadSuccess) onUploadSuccess();
      else window.location.reload();

    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload story");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className="glass rounded-2xl p-4 overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileChange}
      />

      <StoryUploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        file={selectedFile}
        onConfirm={handleUploadConfirm}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {/* === CURRENT USER STORY BUTTON === */}
        <motion.div
          className="relative flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative" onClick={() => {
            if (myStory) {
              onStoryClick(myStory._id);
            } else {
              triggerUpload();
            }
          }}>
            <AvatarRing
              src={myStory ? (myStory.type === 'image' ? myStory.url : getUserAvatar(currentUser)) : getUserAvatar(currentUser)}
              alt="Your Story"
              size="lg"
              hasStory={!!myStory}
              isViewed={myStory?.isViewed}
            />

            {!myStory ? (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerUpload();
                }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center border-2 border-background z-10"
              >
                <Plus className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            {isUploading ? "Posting..." : "Your Story"}
          </span>
        </motion.div>

        {/* === OTHER USERS STORIES === */}
        {otherStories.map((story) => {
          const userName = getUserName(story.user);

          return (
            <motion.button
              key={story._id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStoryClick(story._id)}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <AvatarRing
                src={getUserAvatar(story.user)}
                alt={userName}
                size="lg"
                hasStory
                isViewed={story.isViewed}
              />
              <span className={cn(
                "text-xs truncate w-16 text-center font-medium",
                story.isViewed ? "text-muted-foreground" : "text-foreground"
              )}>
                {userName.split('.')[0]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  )
}