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
import { FeedPostOptionsDialog } from "@/components/post/FeedPostOptionsDialog"
import { LikesCountDialog } from "@/components/post/LikesCountDialog"
import { ShareDialog } from "@/components/reels/ShareDialog"
import { useAuth } from "@/context/AuthContext"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const { user: authUser, refreshUser } = useAuth();

  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isSaved, setIsSaved] = useState(post.isSaved)
  const [likes, setLikes] = useState(post.likes)
  const [showHeart, setShowHeart] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isLikesOpen, setIsLikesOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [showFullCaption, setShowFullCaption] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewsCount, setViewsCount] = useState(post.viewsCount || 0)
  const hasIncrementedView = useRef(false)
  
  // ✅ LOCAL FOLLOW STATE: For optimistic UI
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | null>(null);

  // ✅ GLOBAL MUTE LOGIC: Read initial state from localStorage
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("videoMuted") === "true";
  });

  const lastTapRef = useRef(0)

  // ✅ Listen for changes to the global mute state from other PostCards
  useEffect(() => {
    const handleMuteChange = () => {
      const globalMuteStatus = localStorage.getItem("videoMuted") === "true";
      setIsMuted(globalMuteStatus);
    };

    window.addEventListener("videoMuteToggle", handleMuteChange);
    return () => window.removeEventListener("videoMuteToggle", handleMuteChange);
  }, []);

  // ✅ Toggle Function: Updates local, storage, and notifies other components
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuteStatus = !isMuted;
    setIsMuted(newMuteStatus);
    localStorage.setItem("videoMuted", String(newMuteStatus));
    // Dispatch a custom event so other PostCards update their state instantly
    window.dispatchEvent(new Event("videoMuteToggle"));
  };

  const isFollowing = useMemo(() => {
    // If we have a local override, use it
    if (localIsFollowing !== null) return localIsFollowing;

    if (!authUser || !authUser.following) return true;
    return (authUser as any).following.some((id: any) =>
      (typeof id === 'string' ? id : id._id) === post.user._id
    );
  }, [authUser, post.user._id, localIsFollowing]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic Update
    setLocalIsFollowing(true);
    
    try {
      await api.post(`/users/follow/${post.user._id}`);
      toast.success(`Following ${post.user.username}`);
      await refreshUser();
    } catch (error) {
      setLocalIsFollowing(false);
      toast.error("Failed to follow");
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      await api.delete(`/posts/${post._id}/delete`);
      toast.success("Post deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  const rawVideoUrl = (post as any).videoUrl;
  const hasVideo = typeof rawVideoUrl === 'string' && rawVideoUrl.trim().length > 0;

  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;
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

  useEffect(() => {
    if (hasVideo && isPlaying && !hasIncrementedView.current) {
      const viewedKey = `viewed_post_${post._id}`;
      if (sessionStorage.getItem(viewedKey)) {
        hasIncrementedView.current = true;
        return;
      }

      const timer = setTimeout(async () => {
        try {
          await api.patch(`/posts/${post._id}/view`);
          setViewsCount((prev: number) => prev + 1);
          hasIncrementedView.current = true;
          sessionStorage.setItem(viewedKey, 'true');
        } catch (error) {
          console.error("Failed to increment Post view count", error);
        }
      }, 3000); // 3 seconds watch time
      return () => clearTimeout(timer);
    }
  }, [hasVideo, isPlaying, post._id]);

  const handleMediaInteract = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
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
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    try {
      await api.post(`/posts/${post._id}/like`)
    } catch (error) {
      setIsLiked(prevLiked);
      setLikes(post.likes);
      toast.error("Failed to like post");
    }
  }

  const handleSave = async () => {
    const prevSaved = isSaved;
    setIsSaved(!isSaved);
    try {
      await api.post(`/posts/${post._id}/save`);
      toast.success(isSaved ? "Removed from saved" : "Saved to collection", { duration: 1500 });
    } catch (error) {
      setIsSaved(prevSaved);
    }
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
      <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl overflow-hidden mb-6 relative border border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Link to={`/u/${post.user.username}`}>
              <AvatarRing src={post.user?.profilePic || "/image.png"} size="sm" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link to={`/u/${post.user.username}`} className="font-semibold text-sm hover:underline">{post.user.name}</Link>

                {!isFollowing && post.user._id !== authUser?._id && (
                  <button
                    onClick={handleFollow}
                    className="text-primary text-xs font-bold hover:text-primary/80 transition-colors"
                  >
                    • Follow
                  </button>
                )}
              </div>
              {post.location && <p className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {post.location}</p>}
            </div>
          </div>
          <button onClick={() => setIsOptionsOpen(true)}><MoreHorizontal className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden" onClick={handleMediaInteract}>
          {hasVideo ? (
            <>
              <video ref={videoRef} src={rawVideoUrl} className="w-full h-full object-contain" loop muted={isMuted} playsInline />
              {!isPlaying && <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"><Play className="w-16 h-16 text-white/80 fill-white" /></div>}

              {/* ✅ Mute button updated with global toggle function */}
              <button onClick={toggleMute} className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white z-10 hover:bg-black/70 transition-colors">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <img src={post.images?.[0] || "/placeholder-image.jpg"} className="w-full h-full object-cover" />
          )}

          <AnimatePresence>
            {showHeart && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Heart className={cn("w-6 h-6 cursor-pointer transition-colors", isLiked ? "text-red-500 fill-red-500" : "text-foreground")} onClick={handleLike} />
              <MessageCircle className="w-6 h-6 -rotate-90 cursor-pointer" onClick={() => setIsModalOpen(true)} />
              <Send className="w-6 h-6 cursor-pointer" onClick={() => setIsShareOpen(true)} />
            </div>
            <Bookmark className={cn("w-6 h-6 cursor-pointer", isSaved ? "fill-foreground" : "")} onClick={handleSave} />
          </div>

          <button onClick={() => setIsLikesOpen(true)} className="font-semibold text-sm hover:underline">{likes} likes</button>

          <div className="text-sm">
            <span className="font-semibold mr-2">{post.user.username}</span>
            {renderCaption()}
            {post.caption && post.caption.length > 80 && !showFullCaption && (
              <button onClick={() => setShowFullCaption(true)} className="text-muted-foreground font-semibold ml-1">more</button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground tracking-wide">{formatDate(post.createdAt)}</p>
        </div>
      </motion.article>

      <PostModal post={post} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <FeedPostOptionsDialog
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        postId={post._id}
        isOwnPost={post.user._id === authUser?._id}
        onDelete={handleDeletePost}
      />

      <LikesCountDialog
        isOpen={isLikesOpen}
        onClose={() => setIsLikesOpen(false)}
        postId={post._id}
        likesCount={likes}
        viewsCount={viewsCount}
      />
      <ShareDialog isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} post={post} />
    </>
  )
}