import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Heart,
    MessageCircle,
    Bookmark,
    MoreHorizontal,
    Share2,
    Smile,
    Play,
    VolumeX,
    Volume2,
    AlertCircle,
    Trash2,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import type { Post } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { FeedPostOptionsDialog } from "@/components/post/FeedPostOptionsDialog";
import { EditPostDialog } from "@/components/post/EditPostDialog";
import { LikesCountDialog } from "@/components/post/LikesCountDialog";
import { ShareDialog } from "@/components/reels/ShareDialog";

interface PostViewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    post: Post | null;
    showEditOption?: boolean;
}

interface Comment {
    _id: string;
    text: string;
    user: {
        _id: string;
        username: string;
        profilePic: string;
    };
    likes: string[];
    createdAt: string;
}

export function PostViewDialog({ isOpen, onClose, post, showEditOption }: PostViewDialogProps) {
    const { user: currentUser } = useAuth();

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [fetchedUser, setFetchedUser] = useState<any>(null);

    const [localPostData, setLocalPostData] = useState<Post | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [viewsCount, setViewsCount] = useState(0);

    const [muted, setMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);

    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLikesOpen, setIsLikesOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const getSafeLikesCount = useCallback((likes: any): number => {
        if (typeof likes === "number") return likes;
        if (Array.isArray(likes)) return likes.length;
        return 0;
    }, []);

    const refreshPost = useCallback(async () => {
        if (!localPostData?._id) return;
        try {
            const { data } = await api.get(`/posts/${localPostData._id}`);
            const freshPost: Post = data.data || data;
            setLocalPostData(freshPost);
            setIsLiked(!!freshPost.isLiked);
            setIsSaved(!!freshPost.isSaved);
            setLikesCount(getSafeLikesCount(freshPost.likes));
            setViewsCount(freshPost.viewsCount || 0);
        } catch (err) {
            console.error("Failed to refresh post data", err);
        }
    }, [localPostData?._id, getSafeLikesCount]);

    // 1. FIX: RESET ALL STATES ON CLOSE 
    // This ensures that when the parent re-opens the same post, the dialog is "clean"
    useEffect(() => {
        if (!isOpen) {
            setIsOptionsOpen(false);
            setIsEditOpen(false);
            setIsLikesOpen(false);
            setIsShareOpen(false);
            setReplyingTo(null);
            setNewComment("");
            setComments([]);
            setLocalPostData(null); // Clear local data so next open is fresh
            setFetchedUser(null);
        }
    }, [isOpen]);

    // 2. SET INITIAL DATA WHEN POST PROP CHANGES
    useEffect(() => {
        if (post) {
            setLocalPostData(post);
            setComments([]); // Immediate clear to prevent "ghosting" from previous post
            setFetchedUser(null);
        }
    }, [post]);

    // 3. LOAD FRESH DATA ON MOUNT
    useEffect(() => {
        if (isOpen && localPostData?._id) {
            refreshPost();
            fetchComments(localPostData._id);

            setLikesCount(getSafeLikesCount(localPostData.likes));
            setIsLiked(!!localPostData.isLiked);
            setIsSaved(!!localPostData.isSaved);
            setViewsCount(localPostData.viewsCount || 0);
            setIsPlaying(true);

            if (typeof localPostData.user === "string") {
                fetchUserDetails(localPostData.user);
            }
        }
    }, [isOpen, localPostData?._id, refreshPost, getSafeLikesCount]);

    // Video Autoplay logic with cleanup
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (isOpen && localPostData && videoRef.current) {
            timeoutId = setTimeout(async () => {
                try {
                    if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        await videoRef.current.play();
                        setIsPlaying(true);
                    }
                } catch (e) {
                    console.warn("Autoplay blocked", e);
                    setIsPlaying(false);
                }
            }, 150);
        }
        return () => clearTimeout(timeoutId);
    }, [isOpen, localPostData?._id]);

    // Track View within Dialog
    useEffect(() => {
        if (isOpen && localPostData?._id) {
            const viewedKey = `viewed_post_${localPostData._id}`;
            if (sessionStorage.getItem(viewedKey)) return;

            const incrementView = async () => {
                try {
                    await api.patch(`/posts/${localPostData._id}/view`);
                    setViewsCount((prev) => prev + 1);
                    sessionStorage.setItem(viewedKey, "true");
                } catch (e) {
                    console.error("Failed to increment view in dialog", e);
                }
            };

            const timer = setTimeout(incrementView, 3000); // 3 seconds engagement
            return () => clearTimeout(timer);
        }
    }, [isOpen, localPostData?._id]);

    const fetchUserDetails = async (userId: string) => {
        try {
            const { data } = await api.get(`/users/${userId}`);
            setFetchedUser(data.data || data);
        } catch (e) {
            console.error("Failed to fetch user", e);
        }
    };

    const fetchComments = async (postId: string) => {
        setIsLoadingComments(true);
        try {
            const { data } = await api.get(`/comments/post/${postId}`);
            const fetched = Array.isArray(data.data)
                ? data.data
                : data.data?.docs || data.data || [];
            setComments(fetched);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoadingComments(false);
        }
    };

    const handleLike = async () => {
        if (!localPostData?._id) return;
        const prevLiked = isLiked;
        const newLiked = !prevLiked;
        const newCount = newLiked ? likesCount + 1 : likesCount - 1;
        setIsLiked(newLiked);
        setLikesCount(newCount);
        try {
            await api.post(`/posts/${localPostData._id}/like`);
            await refreshPost();
        } catch (error) {
            setIsLiked(prevLiked);
            setLikesCount(prevLiked ? likesCount : likesCount);
            toast.error("Failed to update like");
        }
    };

    const handleSave = async () => {
        if (!localPostData?._id) return;
        const prevSaved = isSaved;
        setIsSaved(!isSaved);
        try {
            await api.post(`/posts/${localPostData._id}/save`);
            toast.success(!prevSaved ? "Saved" : "Removed from saved");
        } catch (error) {
            setIsSaved(prevSaved);
            toast.error("Failed to save");
        }
    };

    const handleDeletePost = async () => {
        if (!localPostData) return;
        if (!confirm("Delete this content?")) return;
        try {
            await api.delete(`/posts/${localPostData._id}/delete`);
            toast.success("Deleted successfully");
            onClose();
            window.location.reload();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleEditPost = async (updatedData: { caption: string; location: string; taggedUsers: string[] }) => {
        if (!localPostData) return;
        try {
            await api.put(`/posts/${localPostData._id}`, {
                caption: updatedData.caption,
                location: updatedData.location,
            });
            setLocalPostData((prev) =>
                prev ? { ...prev, caption: updatedData.caption, location: updatedData.location } : null
            );
            toast.success("Post updated successfully!");
        } catch (error) {
            toast.error("Failed to update post");
        }
    };

    const toggleVideoPlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    };

    const initiateReply = (comment: Comment) => {
        const username = comment.user?.username || "Unknown";
        setReplyingTo(comment);
        setNewComment(`@${username} `);
        inputRef.current?.focus();
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !localPostData) return;
        try {
            const payload = { content: newComment, parentCommentId: replyingTo ? replyingTo._id : null };
            const { data } = await api.post(`/comments/post/${localPostData._id}`, payload);
            const created = data.data || data;
            setComments([created, ...comments]);
            setNewComment("");
            setReplyingTo(null);
        } catch (error) {
            toast.error("Failed to post comment");
        }
    };

    const toggleCommentLike = async (commentId: string) => {
        if (!currentUser) return;
        setComments((prev) =>
            prev.map((c) =>
                c._id === commentId
                    ? {
                        ...c,
                        likes: c.likes.includes(currentUser._id)
                            ? c.likes.filter((id) => id !== currentUser._id)
                            : [...c.likes, currentUser._id],
                    }
                    : c
            )
        );
        try {
            await api.post(`/comments/${commentId}/like`);
        } catch (err) {
            if (localPostData?._id) fetchComments(localPostData._id);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/comments/${commentId}/delete`);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
            toast.success("Comment deleted");
        } catch (error) {
            toast.error("Failed to delete comment");
        }
    };

    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            if (seconds < 60) return "Just now";
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
            if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
            return date.toLocaleDateString();
        } catch { return ""; }
    };

    const formatPostDate = (dateString: string) => {
        if (!dateString) return "";
        try {
            return new Date(dateString)
                .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                .toUpperCase();
        } catch { return ""; }
    };

    const currentDisplayUser =
        fetchedUser ||
        (localPostData && typeof localPostData.user === "object" ? localPostData.user : null) || {
            username: "Unknown",
            profilePic: "",
        };

    const rawVideoUrl = (localPostData as any)?.videoUrl || "";
    const rawImageUrl = (localPostData as any)?.image || localPostData?.images?.[0] || (localPostData as any)?.thumbnailUrl || "";

    const normalizedPost = localPostData
        ? {
            ...localPostData,
            user: currentDisplayUser,
            videoUrl: rawVideoUrl,
            imageUrl: rawImageUrl,
            isVideo: !!rawVideoUrl.trim(),
        }
        : null;

    if (!normalizedPost) return null;

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                        />
                        <div className="fixed inset-0 z-[101] flex items-center justify-center p-0 md:p-8 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full h-full md:w-[95%] lg:w-[90%] xl:w-[85%] md:max-w-6xl md:h-[85vh] bg-background/95 glass-strong border border-white/10 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row pointer-events-auto neon-glow"
                            >
                                {/* ... Media Section ... */}
                                <div className="w-full md:w-[50%] lg:w-[55%] xl:w-[60%] h-[40vh] md:h-full bg-black/40 flex items-center justify-center relative shrink-0 overflow-hidden group">
                                    <div className="absolute inset-0 z-0 text-center">
                                        {normalizedPost.isVideo ? (
                                            <video src={normalizedPost.videoUrl} className="w-full h-full object-cover blur-2xl opacity-30" />
                                        ) : (
                                            <img src={normalizedPost.imageUrl} className="w-full h-full object-cover blur-2xl opacity-30" />
                                        )}
                                    </div>

                                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                                        {normalizedPost.isVideo ? (
                                            <div className="relative w-full h-full flex items-center justify-center group/video cursor-pointer" onClick={toggleVideoPlay}>
                                                <video
                                                    key={normalizedPost.videoUrl}
                                                    ref={videoRef}
                                                    src={normalizedPost.videoUrl}
                                                    className="w-full h-full object-contain shadow-2xl"
                                                    loop
                                                    muted={muted}
                                                    playsInline
                                                />
                                                
                                                <AnimatePresence>
                                                    {!isPlaying && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.5 }}
                                                            className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]"
                                                        >
                                                            <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                                <Play className="w-10 h-10 text-white fill-white ml-1" />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="absolute bottom-6 right-6 flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMuted(!muted);
                                                        }}
                                                        className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition-colors"
                                                    >
                                                        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                    </motion.button>
                                                </div>
                                            </div>
                                        ) : normalizedPost.imageUrl ? (
                                            <img src={normalizedPost.imageUrl} alt="Post" className="w-full h-full object-contain shadow-2xl" />
                                        ) : (
                                            <div className="text-muted-foreground flex flex-col items-center gap-3">
                                                <AlertCircle className="w-12 h-12 opacity-30" />
                                                <span className="text-sm font-medium">Content Preview Unavailable</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 left-4 p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white md:hidden hover:bg-black/60 z-20 border border-white/10"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* --- INTERACTION SECTION --- */}
                                <div className="flex-1 flex flex-col h-full bg-background/50 min-h-0 border-l border-white/5">
                                    {/* Header */}
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-card/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-500 p-[2px] shadow-lg">
                                                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                                                    <img
                                                        src={normalizedPost.user.profilePic || "/image.png"}
                                                        alt={normalizedPost.user.username}
                                                        className="w-full h-full object-cover bg-muted"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <span className="font-bold text-sm hover:text-amber-500 transition-colors cursor-pointer block leading-tight">
                                                    {normalizedPost.user.username}
                                                </span>
                                                {normalizedPost.location && (
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-0.5 block">{normalizedPost.location}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => setIsOptionsOpen(true)} className="rounded-full h-9 w-9 hover:bg-white/10">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex rounded-full h-9 w-9 hover:bg-white/10">
                                                <X className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Interaction Area (Comments & Caption) */}
                                    <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide bg-transparent custom-scrollbar">
                                        {normalizedPost.caption && (
                                            <div className="flex gap-4">
                                                <div className="shrink-0 w-9 h-9">
                                                    <img src={normalizedPost.user.profilePic || "/default-avatar.png"} className="w-full h-full rounded-full object-cover border border-white/10 shadow-sm" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-sm">
                                                        <span className="font-bold mr-2 text-primary">{normalizedPost.user.username}</span>
                                                        <span className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{normalizedPost.caption}</span>
                                                    </div>
                                                    <div className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60 mt-2 flex items-center gap-2">
                                                        {formatTimeAgo(normalizedPost.createdAt)}
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                        Author
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-6 pt-2">
                                            {isLoadingComments ? (
                                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                                    <div className="w-8 h-8 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Loading Thoughts...</p>
                                                </div>
                                            ) : comments.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                        <MessageCircle className="w-8 h-8 text-muted-foreground" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-sm">No comments yet</p>
                                                        <p className="text-xs">Be the first to share your thoughts!</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                comments.map((comment) => {
                                                    const isCommentLiked = comment.likes?.includes(currentUser?._id || "");
                                                    const cUser = comment.user || { username: "Unknown", profilePic: "" };
                                                    const canDelete = currentUser?._id === cUser._id || currentUser?._id === normalizedPost.user._id;

                                                    return (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            key={comment._id} 
                                                            className="flex gap-4 group text-left"
                                                        >
                                                            <div className="shrink-0 w-9 h-9">
                                                                <img src={cUser.profilePic || "/image.png"} className="w-full h-full rounded-full object-cover border border-white/5 shadow-sm" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <div className="text-sm">
                                                                        <span className="font-bold mr-2 hover:text-amber-500 transition-colors cursor-pointer">{cUser.username}</span>
                                                                        <span className="text-foreground/90 break-words leading-relaxed">{comment.text}</span>
                                                                    </div>
                                                                    <motion.button 
                                                                        whileTap={{ scale: 0.8 }}
                                                                        onClick={() => toggleCommentLike(comment._id)} 
                                                                        className="shrink-0 pt-1"
                                                                    >
                                                                        <Heart className={cn("w-3.5 h-3.5 transition-all", isCommentLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-white")} />
                                                                    </motion.button>
                                                                </div>
                                                                <div className="flex items-center gap-4 mt-2 text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">
                                                                    <span>{formatTimeAgo(comment.createdAt)}</span>
                                                                    {comment.likes?.length > 0 && <span className="text-amber-500/80">{comment.likes.length} likes</span>}
                                                                    <button onClick={() => initiateReply(comment)} className="hover:text-foreground transition-colors">Reply</button>
                                                                    {canDelete && (
                                                                        <button onClick={() => handleDeleteComment(comment._id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all transform group-hover:translate-x-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions & Input */}
                                    <div className="border-t border-white/10 p-5 bg-card/40 backdrop-blur-md space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike} className="hover:opacity-70 transition-opacity">
                                                    <Heart className={cn("w-7 h-7 transition-all", isLiked ? "fill-red-500 text-red-500" : "text-foreground")} />
                                                </motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} className="hover:opacity-70 transition-opacity" onClick={() => inputRef.current?.focus()}>
                                                    <MessageCircle className="w-7 h-7 -rotate-90" />
                                                </motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsShareOpen(true)} className="hover:opacity-70 transition-opacity">
                                                    <Share2 className="w-7 h-7" />
                                                </motion.button>
                                            </div>
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} className="hover:opacity-70 transition-opacity">
                                                <Bookmark className={cn("w-7 h-7 transition-all", isSaved ? "fill-primary text-primary" : "text-foreground")} />
                                            </motion.button>
                                        </div>

                                        <div className="space-y-1 text-left">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => setIsLikesOpen(true)} className="font-black text-sm hover:text-amber-500 transition-colors">
                                                    {likesCount.toLocaleString()} {likesCount === 1 ? 'Like' : 'Likes'}
                                                </button>
                                                <div className="flex items-center gap-1.5 opacity-50">
                                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-xs font-bold text-muted-foreground">{viewsCount.toLocaleString()} <span className="hidden sm:inline">Views</span></span>
                                                </div>
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                                {formatPostDate(normalizedPost.createdAt)}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <form onSubmit={handleAddComment} className="relative flex items-center group/input">
                                                <div className="absolute left-0 p-2 text-muted-foreground hidden sm:block">
                                                    <Smile className="w-5 h-5 opacity-50 group-focus-within/input:opacity-100 transition-opacity" />
                                                </div>
                                                <Input
                                                    ref={inputRef}
                                                    placeholder={replyingTo ? `Replying to @${replyingTo.user?.username}...` : "Share your thoughts..."}
                                                    className="border-white/10 bg-white/5 focus-visible:ring-primary/20 pl-4 sm:pl-10 pr-16 h-12 rounded-2xl text-sm shadow-inner"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                />
                                                <AnimatePresence>
                                                    {newComment.trim().length > 0 && (
                                                        <motion.button 
                                                            initial={{ opacity: 0, x: 10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 10 }}
                                                            type="submit" 
                                                            className="absolute right-3 text-primary font-black text-xs uppercase tracking-widest hover:text-amber-400 transition-colors"
                                                        >
                                                            Post
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {normalizedPost && (
                <>
                    <FeedPostOptionsDialog
                        isOpen={isOptionsOpen}
                        onClose={() => setIsOptionsOpen(false)}
                        postId={normalizedPost._id}
                        isOwnPost={currentUser?._id === normalizedPost.user._id}
                        onDelete={handleDeletePost}
                        {...(showEditOption ? { onEdit: () => setIsEditOpen(true) } : {})}
                    />
                    <EditPostDialog
                        isOpen={isEditOpen}
                        onClose={() => setIsEditOpen(false)}
                        caption={normalizedPost.caption || ""}
                        onSave={handleEditPost}
                    />
                     <LikesCountDialog
                        isOpen={isLikesOpen}
                        onClose={() => setIsLikesOpen(false)}
                        likesCount={likesCount}
                        postId={normalizedPost._id}
                        viewsCount={viewsCount}
                    />
                    <ShareDialog
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        post={normalizedPost}
                    />
                </>
            )}
        </>,
        document.body
    );
}