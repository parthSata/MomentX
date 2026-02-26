import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Plus, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { MainLayout } from "@/components/navigation/MainLayout"
import { StoriesBar } from "@/components/feed/StoriesBar"
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

  const { stories, markAsViewed, deleteStory, replyStory, likeStory, fetchStories } = useStories()

  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)

  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const uniqueUserStories = useMemo(() => {
    const seenUsers = new Set();
    const result = [];
    for (const story of stories) {
      const userId = typeof story.user === 'object' && story.user !== null
        ? (story.user as any)._id
        : story.user;

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
        <StoriesBar
          stories={uniqueUserStories}
          onStoryClick={handleStoryClick}
          currentUser={currentUser}
          onUploadSuccess={() => fetchStories()}
        />

        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post._id}
              ref={index === posts.length - 1 ? lastPostElementRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* PostCard will now automatically handle videoUrls due to our backend formatting */}
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
            <p className="text-center text-muted-foreground py-10">No posts or reels yet.</p>
          )}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/create")}
        className="fixed bottom-24 md:bottom-8 right-4 z-50 w-14 h-14 bg-linear-to-r from-indigo-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center md:hidden text-white"
      >
        <Plus className="w-7 h-7" />
      </motion.button>

      {!authLoading && (
        <StoryViewer
          isOpen={storyViewerOpen}
          onClose={() => setStoryViewerOpen(false)}
          initialIndex={selectedStoryIndex}
          stories={stories}
          onViewStory={markAsViewed}
          onDeleteStory={deleteStory}
          onReplyStory={async (id, msg) => {
            await replyStory(id, msg);
          }}
          onLikeStory={likeStory}
          currentUserId={currentUser?._id}
        />
      )}
    </MainLayout>
  )
}