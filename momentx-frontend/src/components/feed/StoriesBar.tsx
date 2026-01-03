import { useRef } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarRing } from "@/components/ui/avatar-ring"
import type { Story } from "@/hooks/useStories"

interface StoriesBarProps {
  stories: Story[];
  onStoryClick: (storyIndex: number) => void;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  currentUser: any; // ✅ Accept currentUser from parent
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

  // ✅ Check if current user already has a story
  const myStory = safeStories.find(s => s.user._id === currentUser?._id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        {/* 'Your Story' Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // If I have a story, view it. If not, open upload dialog.
            if (myStory) {
              const index = stories.findIndex(s => s._id === myStory._id);
              if (index !== -1) onStoryClick(index);
            } else {
              fileInputRef.current?.click();
            }
          }}
          disabled={isUploading}
          className="flex flex-col items-center gap-2 shrink-0"
        >
          <div className="relative">
            {/* ✅ Display User Avatar or Their Story Thumbnail */}
            <AvatarRing
              src={myStory && myStory.type === 'image' ? myStory.url : (currentUser?.avatar || "/default-avatar.png")}
              alt="Your Story"
              size="lg"
              hasStory={!!myStory} // Show ring if story exists
              isViewed={myStory?.isViewed}
            />

            {/* Show Plus icon only if NO story */}
            {!myStory && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {isUploading ? "Posting..." : "Your Story"}
          </span>
        </motion.button>

        {/* Other Users' Stories */}
        {safeStories
          .filter(s => s.user._id !== currentUser?._id) // Don't show myself again in the list
          .map((story) => {

            const originalIndex = stories.findIndex(s => s._id === story._id);

            return (
              <motion.button
                key={story._id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStoryClick(originalIndex)}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                {/* Thumbnail: Use story image if available, else user avatar */}
                <AvatarRing
                  src={story.type === 'image' ? story.url : story.user.avatar}
                  alt={story.user.displayName}
                  size="lg"
                  hasStory
                  isViewed={story.isViewed}
                />
                <span className={cn(
                  "text-xs truncate w-16 text-center",
                  story.isViewed ? "text-muted-foreground" : "text-foreground"
                )}>
                  {story.user.username?.split('.')[0]}
                </span>
              </motion.button>
            )
          })}
      </div>
    </div>
  )
}