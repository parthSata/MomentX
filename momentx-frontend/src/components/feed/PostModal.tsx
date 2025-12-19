import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile, Copy, Twitter, Facebook } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Post as PostType } from "@/data/mockData"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface PostModalProps {
  post: PostType | null
  isOpen: boolean
  onClose: () => void
}

const mockComments = [
  { id: 1, user: { name: "Sarah", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", username: "sarah_design" }, text: "This is absolutely stunning! 🔥", time: "2h", likes: 24 },
  { id: 2, user: { name: "Mike", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", username: "mike_travel" }, text: "Where was this taken? Need to add to my travel list!", time: "1h", likes: 12 },
  { id: 3, user: { name: "Emma", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", username: "emma.design" }, text: "The colors are incredible 😍", time: "45m", likes: 8 },
  { id: 4, user: { name: "James", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", username: "james.creative" }, text: "Goals! 🎯", time: "30m", likes: 5 },
]

export function PostModal({ post, isOpen, onClose }: PostModalProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likes, setLikes] = useState(0)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState(mockComments)
  const [showShare, setShowShare] = useState(false)
  const [likedComments, setLikedComments] = useState<number[]>([])
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked)
      setIsSaved(post.isSaved)
      setLikes(post.likes)
    }
  }, [post])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    toast.success(isSaved ? "Removed from saved" : "Post saved!")
  }

  const handleCommentLike = (commentId: number) => {
    setLikedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    )
  }

  const handleSubmitComment = () => {
    if (!comment.trim()) return
    const newComment = {
      id: comments.length + 1,
      user: { name: "You", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", username: "you" },
      text: comment,
      time: "now",
      likes: 0
    }
    setComments([...comments, newComment])
    setComment("")
    toast.success("Comment posted!")
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  const handleShare = (type: string) => {
    setShowShare(false)
    if (type === "copy") {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    } else {
      toast.success(`Shared to ${type}!`)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  if (!post) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex glass-strong rounded-3xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 glass rounded-full hover:bg-primary/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row w-full h-full">
              {/* Image Section */}
              <div className="md:w-1/2 lg:w-3/5 h-1/2 md:h-full bg-black/50 flex items-center justify-center">
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Details Section */}
              <div className="md:w-1/2 lg:w-2/5 h-1/2 md:h-full flex flex-col">
                {/* Post Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <AvatarRing src={post.user.avatar} alt={post.user.displayName} size="sm" hasStory />
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
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Caption & Comments */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {/* Caption */}
                  <div className="flex gap-3">
                    <AvatarRing src={post.user.avatar} size="sm" />
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{post.user.username}</span>{" "}
                        {post.caption}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{post.createdAt}</p>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-4">
                    {comments.map((c, index) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-3 group"
                      >
                        <AvatarRing src={c.user.avatar} size="sm" />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{c.user.username}</span>{" "}
                            {c.text}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{c.time}</span>
                            <span>{c.likes + (likedComments.includes(c.id) ? 1 : 0)} likes</span>
                            <button className="hover:text-foreground transition-colors">Reply</button>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCommentLike(c.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className={cn(
                            "w-4 h-4",
                            likedComments.includes(c.id) ? "text-accent fill-accent" : "text-muted-foreground"
                          )} />
                        </button>
                      </motion.div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-border/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike}>
                        <Heart className={cn("w-6 h-6", isLiked ? "text-accent fill-accent" : "")} />
                      </motion.button>
                      <button className="hover:text-muted-foreground transition-colors">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setShowShare(!showShare)}
                          className="hover:text-muted-foreground transition-colors"
                        >
                          <Send className="w-6 h-6" />
                        </button>
                        
                        {/* Share Dropdown */}
                        <AnimatePresence>
                          {showShare && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className="absolute bottom-full left-0 mb-2 glass-strong rounded-xl p-2 min-w-40 shadow-lg"
                            >
                              <button 
                                onClick={() => handleShare("copy")}
                                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-primary/20 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                                <span className="text-sm">Copy link</span>
                              </button>
                              <button 
                                onClick={() => handleShare("Twitter")}
                                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-primary/20 transition-colors"
                              >
                                <Twitter className="w-4 h-4" />
                                <span className="text-sm">Twitter</span>
                              </button>
                              <button 
                                onClick={() => handleShare("Facebook")}
                                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-primary/20 transition-colors"
                              >
                                <Facebook className="w-4 h-4" />
                                <span className="text-sm">Facebook</span>
                              </button>
                              <button 
                                onClick={() => handleShare("Messages")}
                                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-primary/20 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm">Messages</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave}>
                      <Bookmark className={cn("w-6 h-6", isSaved ? "fill-foreground" : "")} />
                    </motion.button>
                  </div>

                  <p className="font-semibold">{formatNumber(likes)} likes</p>

                  {/* Comment Input */}
                  <div className="flex items-center gap-2">
                    <button className="hover:text-muted-foreground transition-colors">
                      <Smile className="w-6 h-6" />
                    </button>
                    <Input
                      variant="glass"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSubmitComment()}
                      className="flex-1"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmitComment}
                      disabled={!comment.trim()}
                      className={cn(
                        "font-semibold text-primary transition-opacity",
                        !comment.trim() && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      Post
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
