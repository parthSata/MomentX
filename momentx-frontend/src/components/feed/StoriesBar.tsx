import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { stories, currentUser } from "@/data/mockData"
import { AvatarRing } from "@/components/ui/avatar-ring"

interface StoriesBarProps {
  onStoryClick: (storyIndex: number) => void
}

export function StoriesBar({ onStoryClick }: StoriesBarProps) {
  return (
    <div className="glass rounded-2xl p-4 overflow-hidden">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {/* Add Story */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-2 flex-shrink-0"
        >
          <div className="relative">
            <AvatarRing
              src={currentUser.avatar}
              alt="Your Story"
              size="lg"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Your Story</span>
        </motion.button>

        {/* Other Stories */}
        {stories.slice(1).map((story, index) => (
          <motion.button
            key={story.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStoryClick(index + 1)}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <AvatarRing
              src={story.user.avatar}
              alt={story.user.displayName}
              size="lg"
              hasStory
              isViewed={story.isViewed}
            />
            <span className={cn(
              "text-xs truncate w-16 text-center",
              story.isViewed ? "text-muted-foreground" : "text-foreground"
            )}>
              {story.user.username.split('.')[0]}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
