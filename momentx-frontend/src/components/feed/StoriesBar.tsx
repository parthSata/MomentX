import { useRef } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarRing } from "@/components/ui/avatar-ring"
import type { Story } from "@/hooks/useStories"

interface StoriesBarProps {
  stories: Story[];
  onStoryClick: (storyId: string) => void;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  currentUser: any;
}

export function StoriesBar({
  stories,
  onStoryClick,
  isUploading,
  onFileSelect,
  currentUser
}: StoriesBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const safeStories = Array.isArray(stories) ? stories : [];

  // Helper to safely get string ID
  const getUserId = (user: any) => {
    if (!user) return "";
    return typeof user === 'object' ? user._id?.toString() : user.toString();
  }

  const currentUserId = getUserId(currentUser);

  // 1. Find Current User's latest story
  const myStory = safeStories.find(s => getUserId(s.user) === currentUserId);

  // 2. Filter out Current User
  const otherStories = safeStories.filter(s => getUserId(s.user) !== currentUserId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const triggerUpload = () => fileInputRef.current?.click();

  // Helper to get image safely
  const getUserAvatar = (user: any) => {
    return user?.avatar || user?.profilePic || "/default-avatar.png";
  }

  return (
    <div className="glass rounded-2xl p-4 overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileChange}
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
        {otherStories.map((story) => (
          <motion.button
            key={story._id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStoryClick(story._id)}
            className="flex flex-col items-center gap-2 shrink-0"
          >
            <AvatarRing
              // ✅ FIX: Checks both avatar AND profilePic
              src={getUserAvatar(story.user)}
              alt={story.user?.username || "User"}
              size="lg"
              hasStory
              isViewed={story.isViewed}
            />
            <span className={cn(
              "text-xs truncate w-16 text-center font-medium",
              story.isViewed ? "text-muted-foreground" : "text-foreground"
            )}>
              {story.user?.username?.split('.')[0] || "User"}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}