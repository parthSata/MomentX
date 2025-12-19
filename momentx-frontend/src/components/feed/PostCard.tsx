import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Post as PostType } from "@/data/mockData"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { toast } from "sonner"
import { PostModal } from "./PostModal"

interface PostCardProps {
  post: PostType
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isSaved, setIsSaved] = useState(post.isSaved)
  const [likes, setLikes] = useState(post.likes)
  const [showHeart, setShowHeart] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const lastTapRef = useRef(0)

  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        setIsLiked(true)
        setLikes(prev => prev + 1)
        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 800)
      }
    }
    lastTapRef.current = now
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(prev => isLiked ? prev - 1 : prev + 1)
    if (!isLiked) {
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 800)
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    toast.success(isSaved ? "Removed from saved" : "Post saved!", {
      duration: 2000,
    })
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
        className="glass rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <AvatarRing
              src={post.user.avatar}
              alt={post.user.displayName}
              size="sm"
              hasStory
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
              <span className="text-xs text-muted-foreground">{post.createdAt}</span>
            </div>
          </div>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Image */}
        <div
          className="relative aspect-square cursor-pointer"
          onClick={handleDoubleTap}
        >
          <img
            src={post.image}
            alt={post.caption}
            className="w-full h-full object-cover"
          />
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Heart className="w-24 h-24 text-accent fill-accent animate-heart-pop" />
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
                    isLiked ? "text-accent fill-accent" : "text-foreground"
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

          <p className="font-semibold">{formatNumber(likes)} likes</p>

          <p className="text-sm">
            <span className="font-semibold">{post.user.username}</span>{" "}
            {post.caption.split(" ").map((word, i) =>
              word.startsWith("#") ? (
                <span key={i} className="text-primary font-semibold">
                  {word}{" "}
                </span>
              ) : (
                word + " "
              )
            )}
          </p>

          {post.comments > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all {post.comments} comments
            </button>
          )}
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
