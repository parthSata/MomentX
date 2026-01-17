import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Plus, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { MainLayout } from "@/components/navigation/MainLayout"
import { StoriesBar } from "@/components/feed/StoriesBar" // This now handles uploads
import { PostCard } from "@/components/feed/PostCard"
import { StoryViewer } from "@/components/feed/StoryViewer"
import { PostSkeleton } from "@/components/ui/skeleton-loader"
import { api } from "@/lib/axios"
import { useStories } from "@/hooks/useStories"
import { useAuth } from "@/context/AuthContext"
import type { Post } from "@/types"

export default function HomePage() {
  const navigate = useNavigate()
  const { user: currentUser, loading: authLoading } = useAuth()

  // createStory is available here, but StoriesBar handles it internally now.
  // We keep fetchStories to refresh list after upload.
  const { stories, markAsViewed, deleteStory, replyStory, likeStory, fetchStories } = useStories()

  // --- State ---
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)

  // ❌ REMOVED: uploadFile, isUploadDialogOpen (StoriesBar handles this now)

  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // --- Logic ---

  const uniqueUserStories = useMemo(() => {
    const seenUsers = new Set();
    const result = [];
    for (const story of stories) {
      const userId = story.user?._id || story.user;
      if (userId && !seenUsers.has(userId)) {
        seenUsers.add(userId);
        result.push(story);
      }
    }
    return result;
  }, [stories]);

  const handleStoryClick = (storyId: string) => {
    const index = stories.findIndex(s => s._id === storyId);
    if (index !== -1) {
      setSelectedStoryIndex(index);
      setStoryViewerOpen(true);
    }
  }

  // --- Infinite Scroll for Posts ---
  const observer = useRef<IntersectionObserver | null>(null)
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1)
    })
    if (node) observer.current.observe(node)
  }, [isLoading, hasMore])

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get(`/posts/feed?page=${page}&limit=5`);
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p._id))
        const uniqueNewPosts = data.data.posts.filter((p: Post) => !existingIds.has(p._id))
        return [...prev, ...uniqueNewPosts]
      })
      setHasMore(data.data.hasMore)
    } catch (error) {
      console.error("Failed to fetch feed", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [page])

  return (
    <MainLayout>
      <div className="space-y-6 pb-20">

        {/* Stories Bar */}
        <StoriesBar
          stories={uniqueUserStories}
          onStoryClick={handleStoryClick}
          currentUser={currentUser}
          // ✅ FIX: When upload finishes in StoriesBar, refresh the list
          onUploadSuccess={() => fetchStories()}
        />

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post._id}
              ref={index === posts.length - 1 ? lastPostElementRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-center py-4">
              {page === 1 ? (
                <div className="w-full space-y-4">
                  <PostSkeleton />
                  <PostSkeleton />
                </div>
              ) : (
                <Loader2 className="animate-spin text-primary" />
              )}
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No posts yet.</p>
          )}
        </div>
      </div>

      {/* FAB for Mobile */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/create")}
        className="fixed bottom-24 md:bottom-8 right-4 z-50 w-14 h-14 bg-linear-to-r from-indigo-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center md:hidden text-white"      >
        <Plus className="w-7 h-7" />
      </motion.button>

      {/* Story Viewer */}
      {!authLoading && (
        <StoryViewer
          isOpen={storyViewerOpen}
          onClose={() => setStoryViewerOpen(false)}
          initialIndex={selectedStoryIndex}
          stories={stories}
          onViewStory={markAsViewed}
          onDeleteStory={deleteStory}
          currentUserId={currentUser?._id}
          onReplyStory={replyStory}
          onLikeStory={likeStory}
        />
      )}

    </MainLayout>
  )
}