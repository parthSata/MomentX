import { useState, useRef, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin, Play, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Post } from "@/types"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { toast } from "sonner"
import { PostModal } from "./PostModal"
import { api } from "@/lib/axios"
import { Link } from "react-router-dom"
import { FeedPostOptionsDialog } from "@/components/post/FeedPostOptionsDialog" // ✅ Imported here

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
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

  // Options Dialog state
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)

  // Caption Truncation State
  const [showFullCaption, setShowFullCaption] = useState(false)
  const lastTapRef = useRef(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const rawVideoUrl = (post as any).videoUrl;
  const hasVideo = typeof rawVideoUrl === 'string' && rawVideoUrl.trim().length > 0;

  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;

    videoRef.current.defaultMuted = true;
    videoRef.current.muted = isMuted;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [hasVideo, isMuted]);

  const handleMediaInteract = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      if (hasVideo && videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }
    }
    lastTapRef.current = now;
  };

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevLikes = likes;

    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);

    if (!isLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }

    try {
      await api.post(`/posts/${post._id}/like`)
    } catch (error) {
      setIsLiked(prevLiked);
      setLikes(prevLikes);
      toast.error("Failed to like post");
    }
  }

  const handleSave = async () => {
    const prevSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      await api.post(`/posts/${post._id}/save`);
      toast.success(isSaved ? "Removed from saved" : "Post saved!", { duration: 1500 });
    } catch (error) {
      setIsSaved(prevSaved);
    }
  }

  const handleDeletePost = async () => {
    if (!confirm("Delete this content?")) return;
    try {
      await api.delete(`/posts/${post._id}/delete`);
      toast.success("Content deleted");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete content");
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  }

  const renderCaption = () => {
    if (!post.caption) return null;

    const isLong = post.caption.length > 80;
    const textToShow = (!showFullCaption && isLong) ? post.caption.slice(0, 80).trim() + "..." : post.caption;

    return (
      <span className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
        {textToShow.split(" ").map((word, i) =>
          word.startsWith("#") ? <span key={i} className="text-primary font-medium">{word} </span> : word + " "
        )}
      </span>
    );
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden mb-6 relative border border-border/50"
      >
        <div className="flex items-center justify-between p-4">
          <Link to={`/u/${post.user.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AvatarRing src={post.user.profilePic || "/default-avatar.png"} alt={post.user.username} size="sm" hasStory={false} />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{post.user.name}</span>
                {post.user.isVerified && (
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </div>
              {post.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {post.location}
                </p>
              )}
            </div>
          </Link>

          <button onClick={() => setIsOptionsOpen(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div
          className="relative w-full aspect-square sm:aspect-4/5 max-h-[75vh] md:max-h-150 bg-black cursor-pointer group flex items-center justify-center overflow-hidden"
          onClick={handleMediaInteract}
        >
          {hasVideo ? (
            <>
              <video
                ref={videoRef}
                src={rawVideoUrl}
                className="w-full h-full object-contain"
                loop
                muted={isMuted}
                playsInline
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <Play className="w-16 h-16 text-white/80 fill-white/80" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <img
              src={post.images?.[0] || (post as any).thumbnailUrl || "/placeholder-image.jpg"}
              alt={post.caption || "Post content"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}

          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-heart-pop drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike} className="transition-colors">
                <Heart className={cn("w-6 h-6", isLiked ? "text-red-500 fill-red-500" : "text-foreground")} />
              </motion.button>
              <button onClick={() => setIsModalOpen(true)} className="hover:text-muted-foreground transition-colors">
                <MessageCircle className="w-6 h-6 -rotate-90" />
              </button>
              <button className="hover:text-muted-foreground transition-colors">
                <Send className="w-6 h-6" />
              </button>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} className="transition-colors">
              <Bookmark className={cn("w-6 h-6", isSaved ? "text-foreground fill-foreground" : "text-foreground")} />
            </motion.button>
          </div>

          <p className="font-semibold text-sm">{formatNumber(likes)} likes</p>

          {post.caption && (
            <div className="text-sm">
              <Link to={`/u/${post.user.username}`} className="font-semibold mr-2 hover:underline">
                {post.user.username}
              </Link>

              {renderCaption()}

              {post.caption.length > 80 && !showFullCaption && (
                <button
                  onClick={() => setShowFullCaption(true)}
                  className="text-muted-foreground font-semibold ml-1 hover:text-foreground"
                >
                  more
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-2">
            {formatDate(post.createdAt)}
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
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

      {/* Shared Options Dialog */}
      <FeedPostOptionsDialog
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        postId={post._id}
        isOwnPost={post.user._id === currentUser._id}
        onDelete={handleDeletePost}
      />
    </>
  )
}