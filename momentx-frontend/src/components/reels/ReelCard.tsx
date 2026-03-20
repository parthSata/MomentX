import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, Music2, BadgeCheck, MapPin } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { cn } from "@/lib/utils";
import { ReelCommentsSheet } from "./ReelCommentsSheet";
import { LikesCountDialog } from "@/components/post/LikesCountDialog";
import { ShareDialog } from "@/components/reels/ShareDialog"; // Ensure this matches your path
import { api } from "@/lib/axios";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export interface Reel {
    _id: string;
    user: {
        _id: string;
        username: string;
        avatar: string;
        isVerified: boolean;
        name: string;
        profilePic: string;
    };
    videoUrl: string;
    caption: string;
    likes: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
    music?: string;
    location?: string;
    isLiked?: boolean;
    isSaved?: boolean;
}

interface ReelCardProps {
    reel: Reel;
    isActive: boolean;
    muted: boolean;
    onToggleMute: () => void;
}

export function ReelCard({ reel, isActive, muted, onToggleMute }: ReelCardProps) {
    const { user: currentUser, refreshUser } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showFullCaption, setShowFullCaption] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const [isLiked, setIsLiked] = useState(reel.isLiked || false);
    const [likeCount, setLikeCount] = useState(reel.likes || 0);
    const [commentCount, setCommentCount] = useState(reel.commentsCount || 0);
    const [isSaved, setIsSaved] = useState(reel.isSaved || false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLikesOpen, setIsLikesOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [viewsCount, setViewsCount] = useState(reel.viewsCount || 0);
    const hasIncrementedView = useRef(false);

    useEffect(() => {
        const authUser = currentUser as any;
        if (authUser && authUser.following && reel.user?._id) {
            const isFollowed = authUser.following.some(
                (followId: any) =>
                    (typeof followId === 'string' ? followId : followId._id) === reel.user._id
            );
            setIsFollowing(isFollowed);
        }
    }, [currentUser, reel.user]);

    useEffect(() => {
        setIsLiked(reel.isLiked || false);
        setLikeCount(reel.likes || 0);
        setCommentCount(reel.commentsCount || 0);
        setIsSaved(reel.isSaved || false);
        setViewsCount(reel.viewsCount || 0);
        hasIncrementedView.current = false;
    }, [reel]);

    useEffect(() => {
        if (videoRef.current && reel.videoUrl) {
            if (isActive) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch((error) => console.warn("Reel Autoplay failed:", error));
                }
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isActive, reel.videoUrl]);

    useEffect(() => {
        if (isActive && !hasIncrementedView.current) {
            const viewedKey = `viewed_reel_${reel._id}`;
            if (sessionStorage.getItem(viewedKey)) {
                hasIncrementedView.current = true;
                return;
            }

            const incrementView = async () => {
                try {
                    await api.patch(`/reels/${reel._id}/view`);
                    setViewsCount((prev: number) => prev + 1);
                    hasIncrementedView.current = true;
                    sessionStorage.setItem(viewedKey, 'true');
                } catch (error) {
                    console.error("Failed to increment view count", error);
                }
            };

            // Increment view after 2 seconds of watch time
            const timer = setTimeout(incrementView, 2000);
            return () => clearTimeout(timer);
        }
    }, [isActive, reel._id]);

    const handleLike = async () => {
        const prevLiked = isLiked;
        const prevCount = likeCount;
        setIsLiked(!prevLiked);
        setLikeCount((prev: number) => prevLiked ? prev - 1 : prev + 1);
        try {
            await api.post(`/posts/${reel._id}/like`);
        } catch (error) {
            setIsLiked(prevLiked);
            setLikeCount(prevCount);
        }
    };

    const handleDoubleTap = () => {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
        if (!isLiked) handleLike();
    };

    const handleSave = async () => {
        const prevSaved = isSaved;
        setIsSaved(!isSaved);
        try {
            await api.post(`/posts/${reel._id}/save`);
        } catch (error) {
            setIsSaved(prevSaved);
        }
    };

    const handleFollowToggle = async () => {
        if (!reel.user?._id) return;
        const prevStatus = isFollowing;
        setIsFollowing(!isFollowing);
        try {
            await api.post(`/users/follow/${reel.user._id}`);
            refreshUser();
        } catch (error) {
            setIsFollowing(prevStatus);
        }
    };

    const hasVideo = typeof reel.videoUrl === 'string' && reel.videoUrl.trim() !== "";
    const isOwnReel = currentUser?._id === reel.user?._id;

    return (
        <div className="h-full w-full flex items-center justify-center bg-black relative">
            {/* Blurred Background - Fills empty space gracefully */}
            {hasVideo && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
                    <video src={reel.videoUrl} className="w-full h-full object-cover blur-2xl scale-110" muted playsInline />
                    <div className="absolute inset-0 bg-black/60" />
                </div>
            )}

            <div className="relative h-full w-full md:max-w-100 lg:max-w-112.5 mx-auto bg-black md:rounded-xl overflow-hidden shadow-2xl" onDoubleClick={handleDoubleTap}>
                {hasVideo ? (
                    <video
                        ref={videoRef}
                        src={reel.videoUrl || undefined}
                        className="absolute inset-0 w-full h-full object-contain"
                        loop
                        muted={muted}
                        playsInline
                        onClick={onToggleMute}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50">Content Unavailable</div>
                )}

                <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />

                <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                    className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                    {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </motion.button>

                <AnimatePresence>
                    {showHeart && isActive && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                        >
                            <Heart className="w-24 h-24 text-white fill-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.9)]" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Right Side Buttons */}
                <div className="absolute right-3 bottom-24 md:bottom-20 flex flex-col items-center gap-5 z-20 pb-4">
                    <div className="flex flex-col items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="active:scale-90 transition-transform">
                            <Heart className={cn("w-7 h-7 transition-colors", isLiked ? "text-red-500 fill-red-500" : "text-white")} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setIsLikesOpen(true); }} className="text-white text-xs font-semibold hover:text-gray-300 transition-colors">
                            {likeCount}
                        </button>
                    </div>

                    <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                        <MessageCircle className="w-7 h-7 text-white" />
                        <span className="text-white text-xs font-semibold">{commentCount}</span>
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); setIsShareOpen(true); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                        <Send className="w-7 h-7 text-white -rotate-12" />
                        <span className="text-white text-xs font-semibold">{reel.sharesCount || 0}</span>
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="active:scale-90 transition-transform">
                        <Bookmark className={cn("w-7 h-7 transition-colors", isSaved ? "text-white fill-white" : "text-white")} />
                    </button>

                    <button className="active:scale-90 transition-transform"><MoreHorizontal className="w-7 h-7 text-white" /></button>

                    {/* ✅ FIXED: Removed the restrictive classes that were cropping the profile picture */}
                    <Link to={`/u/${reel.user?.username}`} className="mt-2 block hover:opacity-80 transition-opacity">
                        <AvatarRing
                            src={reel.user?.avatar || reel.user?.profilePic || "/image.png"}
                            size="sm"
                            hasStory={false}
                        />
                    </Link>
                </div>

                {/* Bottom Info Section */}
                <div className="absolute bottom-24 md:bottom-12 left-4 right-16 z-20 pointer-events-auto text-left">
                    <div className="flex items-center gap-2 mb-3">
                        <Link to={`/u/${reel.user?.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <AvatarRing src={reel.user?.avatar || reel.user?.profilePic || "/image.png"} size="sm" />
                            <span className="text-white font-bold text-[15px] shadow-black drop-shadow-md">{reel.user?.username || "Unknown"}</span>
                            {reel.user?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400" />}
                        </Link>

                        {!isOwnReel && (
                            <button
                                onClick={(e) => { e.preventDefault(); handleFollowToggle(); }}
                                className={cn(
                                    "px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ml-2",
                                    isFollowing ? "bg-transparent border-white/50 text-white" : "bg-transparent border-white text-white hover:bg-white/10"
                                )}
                            >
                                {isFollowing ? "Following" : "Follow"}
                            </button>
                        )}
                    </div>
                    <div className="mb-3">
                        <p className="text-white text-[14px] leading-relaxed drop-shadow-md">
                            {showFullCaption ? reel.caption : (reel.caption?.slice(0, 60) || "")}
                            {(reel.caption?.length || 0) > 60 && (
                                <button onClick={(e) => { e.stopPropagation(); setShowFullCaption(!showFullCaption); }} className="text-white/70 font-semibold ml-1 hover:text-white">
                                    {showFullCaption ? " less" : "... more"}
                                </button>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                            <Music2 className="w-3.5 h-3.5 text-white" />
                            <span className="text-white text-xs font-medium">{(reel.music || "Original Audio").slice(0, 25)}</span>
                        </div>
                        {reel.location && (
                            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                                <MapPin className="w-3.5 h-3.5 text-white" />
                                <span className="text-white text-xs font-medium">{reel.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                <ReelCommentsSheet isOpen={showComments} onClose={() => setShowComments(false)} postId={reel._id} commentCount={commentCount.toString()} onCommentAdded={() => setCommentCount((prev: number) => prev + 1)} />
                <LikesCountDialog isOpen={isLikesOpen} onClose={() => setIsLikesOpen(false)} postId={reel._id} likesCount={likeCount} viewsCount={viewsCount} />

                <ShareDialog isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} post={reel} />
            </div>
        </div>
    );
}