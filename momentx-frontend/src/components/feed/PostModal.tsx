import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Heart, MoreHorizontal, Smile, Trash2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Post, Comment } from "@/types"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/lib/axios"
import EmojiPicker, { Theme } from "emoji-picker-react"
import type { EmojiClickData } from "emoji-picker-react"
import { LikesCountDialog } from "@/components/post/LikesCountDialog"

interface PostModalProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
}

export function PostModal({ post, isOpen, onClose }: PostModalProps) {
  // Safe User Retrieval
  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem("momentx_user");
      if (!stored || stored === "undefined") return null;
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }, []);

  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showPostSettings, setShowPostSettings] = useState(false)
  const [isLikesOpen, setIsLikesOpen] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && post) {
      document.body.style.overflow = "hidden"
      fetchComments()
    } else {
      document.body.style.overflow = "unset"
      setReplyingTo(null)
      setShowEmojiPicker(false)
      setShowPostSettings(false)
    }
    return () => { document.body.style.overflow = "unset" }
  }, [isOpen, post])

  const fetchComments = async () => {
    if (!post) return
    setIsCommentsLoading(true)
    try {
      // ✅ FIX: Use new comment route
      const { data } = await api.get(`/comments/post/${post._id}`)
      setComments(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      console.error("Failed to load comments")
      setComments([])
    } finally {
      setIsCommentsLoading(false)
    }
  }

  // --- ACTIONS ---

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/posts/${post._id}/delete`);
      toast.success("Post deleted successfully");
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!currentUser?._id) return toast.error("Please login to like comments");

    setComments(prev => prev.map(c => {
      if (c._id === commentId) {
        const isLiked = c.likes.includes(currentUser._id);
        return {
          ...c,
          likes: isLiked ? c.likes.filter((id: string) => id !== currentUser._id) : [...c.likes, currentUser._id]
        }
      }
      return c;
    }));

    try {
      // ✅ FIX: Use new comment route
      await api.post(`/comments/${commentId}/like`);
    } catch (error) {
      toast.error("Failed to like comment");
      fetchComments();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      // ✅ FIX: Use new comment route
      await api.delete(`/comments/${commentId}/delete`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to delete comment";
      toast.error(msg);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setCommentText((prev) => prev + emojiData.emoji)
  }

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo({ id: comment._id, username: comment.user.username })
    inputRef.current?.focus()
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return

    try {
      const payload = {
        content: commentText,
        parentCommentId: replyingTo?.id || null
      }

      // ✅ FIX: Use new comment route
      const { data } = await api.post(`/comments/post/${post._id}`, payload)

      if (data && data.data) {
        setComments(prev => [data.data, ...prev])
        setCommentText("")
        setReplyingTo(null)
        setShowEmojiPicker(false)
        toast.success(replyingTo ? "Reply sent!" : "Comment posted!")

        if (!replyingTo) {
          setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
        }
      }
    } catch (error) {
      toast.error("Failed to post comment")
    }
  }

  const threadedComments = useMemo(() => {
    const topLevel = comments.filter(c => !c.parentComment)
    const getReplies = (parentId: string) => comments.filter(c => c.parentComment === parentId)
    return { topLevel, getReplies }
  }, [comments])

  // --- COMMENT ITEM COMPONENT ---
  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
    const isCommentLiked = currentUser?._id && comment.likes.includes(currentUser._id);

    const currentUserId = currentUser?._id ? String(currentUser._id) : null;
    const commentAuthorId = String(comment.user._id || comment.user);
    const postAuthorId = post ? String(post.user._id || post.user) : null;

    const isMyComment = currentUserId === commentAuthorId;
    const isMyPost = currentUserId === postAuthorId;
    const canDelete = isMyComment || isMyPost;

    return (
      <div className={cn("flex gap-3 group relative", isReply && "pl-10 mt-2")}>
        <AvatarRing src={comment.user.profilePic || ""} size="sm" />
        <div className="flex-1">
          <div className="bg-muted/30 p-2.5 rounded-xl rounded-tl-none relative group/bubble">
            <p className="text-sm">
              <span className="font-semibold mr-2">{comment.user.username}</span>
              {comment.text}
            </p>

            {canDelete && (
              <button
                onClick={() => handleDeleteComment(comment._id)}
                className="absolute top-2 right-2 opacity-0 group-hover/bubble:opacity-100 hover:text-red-500 transition-all p-1"
                title="Delete Comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 ml-1 text-xs text-muted-foreground">
            <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              onClick={() => handleCommentLike(comment._id)}
              className={cn("font-medium hover:text-red-500 transition-colors", isCommentLiked && "text-red-500")}
            >
              {comment.likes.length} Likes
            </button>
            <button
              onClick={() => handleReplyClick(comment)}
              className="font-medium hover:text-foreground transition-colors flex items-center gap-1"
            >
              Reply
            </button>
          </div>
        </div>

        <button
          onClick={() => handleCommentLike(comment._id)}
          className={cn(
            "self-start mt-2 transition-all",
            isCommentLiked ? "text-red-500 opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500"
          )}
        >
          <Heart className={cn("w-4 h-4", isCommentLiked && "fill-current")} />
        </button>
      </div>
    )
  }

  if (!post) return null

  const isPostOwner = currentUser?._id && post && String(currentUser._id) === String(post.user._id || post.user);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-2 md:inset-8 lg:inset-16 z-50 flex glass-strong rounded-3xl overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 glass rounded-full hover:bg-primary/20 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row w-full h-full">
              {/* Image Section */}
              <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full bg-black/50 items-center justify-center">
                <img src={post.images[0]} alt={post.caption} className="w-full h-full object-contain" />
              </div>

              {/* Details Section */}
              <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col bg-background/50 backdrop-blur-sm relative">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <AvatarRing src={post.user.profilePic || ""} size="sm" />
                    <div>
                      <span className="font-semibold text-sm">{post.user.username}</span>
                      <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Post Settings Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPostSettings(!showPostSettings)}
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </button>
                    {showPostSettings && (
                      <div className="absolute right-0 mt-2 w-48 bg-popover rounded-xl shadow-lg border border-border overflow-hidden z-20">
                        {isPostOwner ? (
                          <button
                            onClick={handleDeletePost}
                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-muted/50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Post
                          </button>
                        ) : (
                          <button className="w-full text-left px-4 py-3 text-sm hover:bg-muted/50">Report Post</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  <div className="flex flex-col gap-3 mb-6">
                    <div className="flex gap-3">
                      <AvatarRing src={post.user.profilePic || ""} size="sm" />
                      <p className="text-sm pt-1">
                        <span className="font-semibold mr-2">{post.user.username}</span>
                        {post.caption}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 ml-11">
                      <button
                        onClick={() => setIsLikesOpen(true)}
                        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                      >
                        <Heart className={cn("w-4 h-4", post.isLiked ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
                        <span className="text-xs font-bold text-muted-foreground">{post.likes} <span className="hidden sm:inline">likes</span></span>
                      </button>

                      <div className="flex items-center gap-1.5 opacity-60">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground">{post.viewsCount || 0} <span className="hidden sm:inline">views</span></span>
                      </div>
                    </div>
                  </div>

                  {isCommentsLoading ? (
                    <p className="text-center text-sm text-muted-foreground">Loading...</p>
                  ) : threadedComments.topLevel.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">No comments yet.</p>
                  ) : (
                    threadedComments.topLevel.map((comment) => (
                      <div key={comment._id}>
                        <CommentItem comment={comment} />
                        {threadedComments.getReplies(comment._id).map(reply => (
                          <CommentItem key={reply._id} comment={reply} isReply={true} />
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-border/50 p-3 bg-background/95 backdrop-blur-md relative z-20">
                  <AnimatePresence>
                    {replyingTo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex items-center justify-between bg-muted/50 px-3 py-1 mb-2 rounded-lg text-xs text-muted-foreground"
                      >
                        <span>Replying to <span className="font-bold text-primary">@{replyingTo.username}</span></span>
                        <button onClick={() => setReplyingTo(null)}><X className="w-3 h-3" /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-4 z-50 shadow-2xl">
                      <EmojiPicker
                        theme={Theme.DARK}
                        onEmojiClick={handleEmojiClick}
                        width={300}
                        height={350}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={cn("p-2 rounded-full transition-colors", showEmojiPicker ? "bg-muted text-primary" : "hover:bg-muted text-muted-foreground")}
                    >
                      <Smile className="w-6 h-6" />
                    </button>
                    <Input
                      ref={inputRef}
                      variant="glass"
                      placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSubmitComment()}
                      className="flex-1"
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim()}
                      className="text-primary font-semibold disabled:opacity-50 text-sm p-2"
                    >
                      Post
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          <LikesCountDialog
            isOpen={isLikesOpen}
            onClose={() => setIsLikesOpen(false)}
            postId={post._id}
            likesCount={post.likes}
            viewsCount={post.viewsCount}
          />
        </>
      )}
    </AnimatePresence>
  )
}