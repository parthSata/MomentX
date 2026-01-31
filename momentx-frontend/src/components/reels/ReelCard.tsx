import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, Music2, BadgeCheck, MapPin } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { cn } from "@/lib/utils";
import { ReelCommentsSheet } from "./ReelCommentsSheet";
import { api } from "@/lib/axios";

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

export function ReelCard({
    reel,
    isActive,
    muted,
    onToggleMute,
}: ReelCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showFullCaption, setShowFullCaption] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showHeart, setShowHeart] = useState(false);

    // Initialize State directly from Props
    const [isLiked, setIsLiked] = useState(reel.isLiked || false);
    const [likeCount, setLikeCount] = useState(reel.likes || 0);
    const [commentCount, setCommentCount] = useState(reel.commentsCount || 0);
    const [isSaved, setIsSaved] = useState(reel.isSaved || false);

    // Sync state if prop changes (Fixes "heart gone after refresh" if backend data is correct)
    useEffect(() => {
        setIsLiked(reel.isLiked || false);
        setLikeCount(reel.likes || 0);
        setCommentCount(reel.commentsCount || 0);
        setIsSaved(reel.isSaved || false);
    }, [reel]);

    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isActive]);

    const handleLike = async () => {
        const prevLiked = isLiked;
        const prevCount = likeCount;

        // Optimistic Update
        setIsLiked(!prevLiked);
        setLikeCount(prev => prevLiked ? prev - 1 : prev + 1);

        try {
            // ✅ FIX: Use '/posts' endpoint because togglePostLike handles both Posts & Reels
            await api.post(`/posts/${reel._id}/like`);
        } catch (error) {
            // Revert on failure
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
        setIsSaved(!prevSaved);
        try {
            // ✅ FIX: Use '/posts' endpoint for saving Reels too
            await api.post(`/posts/${reel._id}/save`);
        } catch (error) {
            setIsSaved(prevSaved);
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-black relative">

            {/* Blurred Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <video src={reel.videoUrl} className="w-full h-full object-cover blur-3xl scale-110" muted />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Main Container */}
            <div className="relative h-full w-full max-w-112.5 mx-auto bg-black md:rounded-xl overflow-hidden shadow-2xl" onDoubleClick={handleDoubleTap}>
                <video
                    ref={videoRef}
                    src={reel.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    loop
                    muted={muted}
                    playsInline
                    onClick={onToggleMute}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/70 pointer-events-none" />

                {/* Mute Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                    className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                    {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </motion.button>

                {/* Double Tap Heart Animation */}
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

                {/* Side Actions Bar */}
                <div className="absolute right-3 bottom-24 md:bottom-20 flex flex-col items-center gap-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                        <Heart className={cn("w-7 h-7 transition-colors", isLiked ? "text-red-500 fill-red-500" : "text-white")} />
                        <span className="text-white text-xs font-semibold">{likeCount}</span>
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                        <MessageCircle className="w-7 h-7 text-white" />
                        <span className="text-white text-xs font-semibold">{commentCount}</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                        <Send className="w-7 h-7 text-white -rotate-12" />
                        <span className="text-white text-xs font-semibold">{reel.sharesCount || 0}</span>
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="active:scale-90 transition-transform">
                        <Bookmark className={cn("w-7 h-7 transition-colors", isSaved ? "text-white fill-white" : "text-white")} />
                    </button>

                    <button className="active:scale-90 transition-transform"><MoreHorizontal className="w-7 h-7 text-white" /></button>

                    <div className="w-9 h-9 mt-1 rounded-lg border border-white/20 overflow-hidden bg-black/50">
                        <motion.img
                            animate={isActive ? { rotate: 360 } : {}}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            src={reel.user.avatar || reel.user.profilePic}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Bottom Info Section */}
                <div className="absolute bottom-20 md:bottom-4 left-3 right-16 z-20 pointer-events-auto text-left">
                    <div className="flex items-center gap-2 mb-2">
                        <AvatarRing src={reel.user.avatar || reel.user.profilePic} size="sm" />
                        <span className="text-white font-bold text-sm shadow-black drop-shadow-md">{reel.user.username}</span>
                        {reel.user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400" />}
                        <button onClick={() => setIsFollowing(!isFollowing)} className={cn("px-3 py-1 text-xs font-semibold rounded-lg border transition-all ml-1", isFollowing ? "bg-transparent border-white/50 text-white" : "bg-transparent border-white text-white hover:bg-white/10")}>
                            {isFollowing ? "Following" : "Follow"}
                        </button>
                    </div>
                    <div className="mb-2">
                        <p className="text-white text-sm leading-relaxed drop-shadow-md">
                            {showFullCaption ? reel.caption : (reel.caption?.slice(0, 60) || "")}
                            {(reel.caption?.length || 0) > 60 && (
                                <button onClick={(e) => { e.stopPropagation(); setShowFullCaption(!showFullCaption); }} className="text-white/60 ml-1 hover:text-white">
                                    {showFullCaption ? " less" : "... more"}
                                </button>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                            <Music2 className="w-3.5 h-3.5 text-white" />
                            <span className="text-white text-xs">{(reel.music || "Original Audio").slice(0, 25)}</span>
                        </div>
                        {reel.location && (
                            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                                <MapPin className="w-3.5 h-3.5 text-white" />
                                <span className="text-white text-xs">{reel.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comment Sheet */}
                <ReelCommentsSheet
                    isOpen={showComments}
                    onClose={() => setShowComments(false)}
                    postId={reel._id}
                    commentCount={commentCount.toString()}
                    onCommentAdded={() => setCommentCount(prev => prev + 1)}
                />

            </div>
        </div>
    );
}