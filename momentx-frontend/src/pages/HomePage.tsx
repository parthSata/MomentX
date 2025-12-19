import { useState } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { posts } from "@/data/mockData"
import { MainLayout } from "@/components/navigation/MainLayout"
import { StoriesBar } from "@/components/feed/StoriesBar"
import { PostCard } from "@/components/feed/PostCard"
import { StoryViewer } from "@/components/feed/StoryViewer"
import { PostSkeleton } from "@/components/ui/skeleton-loader"

export default function HomePage() {
  const navigate = useNavigate()
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [isLoading] = useState(false)

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index)
    setStoryViewerOpen(true)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Stories */}
        <StoriesBar onStoryClick={handleStoryClick} />

        {/* Posts */}
        <div className="space-y-6">
          {isLoading
            ? [...Array(3)].map((_, i) => <PostSkeleton key={i} />)
            : posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/create")}
        className="fixed bottom-24 md:bottom-8 right-4 z-50 w-14 h-14 bg-gradient-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center md:hidden"
      >
        <Plus className="w-7 h-7 text-white" />
      </motion.button>

      {/* Story Viewer */}
      <StoryViewer
        isOpen={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
        initialIndex={selectedStoryIndex}
      />
    </MainLayout>
  )
}
