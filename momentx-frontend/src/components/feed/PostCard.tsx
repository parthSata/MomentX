import { useState, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Post } from "@/types"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { toast } from "sonner"
import { PostModal } from "./PostModal"
import { api } from "@/lib/axios"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  // ✅ FIX: Safe User Retrieval
  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem("momentx_user");
      if (!stored || stored === "undefined") return {};
      return JSON.parse(stored);
    } catch (e) {
      return {};
    }
  }, []);

  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isSaved, setIsSaved] = useState(post.isSaved)
  const [likes, setLikes] = useState(post.likes)
  const [showHeart, setShowHeart] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const lastTapRef = useRef(0)

  // Double tap to like
  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        handleLike()
        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 800)
      }
    }
    lastTapRef.current = now
  }

  // Like API
  const handleLike = async () => {
    const prevLiked = isLiked
    const prevLikes = likes

    setIsLiked(!isLiked)
    setLikes(prev => isLiked ? prev - 1 : prev + 1)

    if (!isLiked) {
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 800)
    }

    try {
      await api.post(`/posts/${post._id}/like`)
    } catch (error) {
      setIsLiked(prevLiked)
      setLikes(prevLikes)
      toast.error("Failed to like post")
    }
  }

  // Save API
  const handleSave = async () => {
    const prevSaved = isSaved
    setIsSaved(!isSaved)

    try {
      await api.post(`/posts/${post._id}/save`)
      toast.success(isSaved ? "Removed from saved" : "Post saved!", {
        duration: 1500,
      })
    } catch (error) {
      setIsSaved(prevSaved)
      toast.error("Failed to save post")
    }
  }

  // Delete Post
  const handleDeletePost = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}/delete`);
      toast.success("Post deleted");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden mb-6 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <AvatarRing
              src={post.user.profilePic || ""}
              alt={post.user.username}
              size="sm"
              hasStory={false}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{post.user.username}</span>
                {post.user.isVerified && (
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Post Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-40 bg-popover rounded-xl shadow-lg border border-border overflow-hidden z-20">
                {/* Only show delete if user owns the post */}
                {post.user._id === currentUser._id ? (
                  <button
                    onClick={handleDeletePost}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted/50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                ) : (
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50">Report</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        <div
          className="relative aspect-square cursor-pointer bg-muted/20"
          onClick={handleDoubleTap}
        >
          <img
            src={post.images[0]}
            alt={post.caption}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-heart-pop drop-shadow-lg" />
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className="transition-colors"
              >
                <Heart
                  className={cn(
                    "w-6 h-6",
                    isLiked ? "text-red-500 fill-red-500" : "text-foreground"
                  )}
                />
              </motion.button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="hover:text-muted-foreground transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="hover:text-muted-foreground transition-colors">
                <Send className="w-6 h-6" />
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              className="transition-colors"
            >
              <Bookmark
                className={cn(
                  "w-6 h-6",
                  isSaved ? "text-foreground fill-foreground" : "text-foreground"
                )}
              />
            </motion.button>
          </div>

          <p className="font-semibold text-sm">{formatNumber(likes)} likes</p>

          <div className="text-sm">
            <span className="font-semibold mr-2">{post.user.username}</span>
            {post.caption.split(" ").map((word, i) =>
              word.startsWith("#") ? (
                <span key={i} className="text-primary font-medium hover:underline cursor-pointer">
                  {word}{" "}
                </span>
              ) : (
                word + " "
              )
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {post.comments > 0 ? `View all ${post.comments} comments` : "Add a comment..."}
          </button>
        </div>
      </motion.article>

      <PostModal
        post={post}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}