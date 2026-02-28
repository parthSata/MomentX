import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Bookmark, MoreHorizontal, Share2, Smile, Play, VolumeX, Volume2, AlertCircle, Trash2 } from "lucide-react";
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

export function PostViewDialog({ isOpen, onClose, post }: PostViewDialogProps) {
    const { user: currentUser } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [fetchedUser, setFetchedUser] = useState<any>(null);

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [muted, setMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLikesOpen, setIsLikesOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const [localPostData, setLocalPostData] = useState<Post | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setIsOptionsOpen(false);
            setIsEditOpen(false);
            setIsLikesOpen(false);
            setIsShareOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (post) setLocalPostData(post);
    }, [post]);

    const isUserUnpopulated = localPostData && (typeof localPostData.user === 'string');
    const displayUser = fetchedUser || (localPostData && typeof localPostData.user === 'object' ? localPostData.user : null) || { username: "Unknown", profilePic: "" };

    const rawVideoUrl = (localPostData as any)?.videoUrl || "";
    const rawImageUrl = (localPostData as any)?.image || localPostData?.images?.[0] || (localPostData as any)?.thumbnailUrl || "";

    const normalizedPost = localPostData ? {
        ...localPostData,
        user: displayUser,
        videoUrl: rawVideoUrl,
        imageUrl: rawImageUrl,
        isVideo: typeof rawVideoUrl === 'string' && rawVideoUrl.trim().length > 0
    } : null;

    useEffect(() => {
        if (localPostData && isOpen) {
            const likesData = localPostData.likes as any;
            const count = typeof likesData === 'number' ? likesData : (Array.isArray(likesData) ? likesData.length : 0);
            setIsLiked(localPostData.isLiked || false);
            setIsSaved(localPostData.isSaved || false);
            setLikesCount(count);
            setReplyingTo(null);
            setNewComment("");
            setFetchedUser(null);
            setIsPlaying(true);

            if (normalizedPost?.isVideo) {
                setTimeout(() => {
                    if (videoRef.current && (videoRef.current.currentSrc || videoRef.current.src)) {
                        videoRef.current.currentTime = 0;
                        const playPromise = videoRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise.catch((error) => {
                                console.warn("Auto-play prevented by browser:", error);
                                setIsPlaying(false);
                            });
                        }
                    }
                }, 100);
            }
            fetchComments(localPostData._id);
            if (isUserUnpopulated) {
                fetchUserDetails(localPostData._id as unknown as string);
            }
        }
    }, [localPostData?._id, isOpen]);

    const fetchUserDetails = async (userId: string) => {
        try {
            const { data } = await api.get(`/users/${userId}`);
            if (data && data.data) setFetchedUser(data.data);
        } catch (e) {
            console.error("Failed to fetch user details", e);
        }
    };

    const fetchComments = async (postId: string) => {
        setIsLoadingComments(true);
        try {
            const { data } = await api.get(`/comments/post/${postId}`);
            let fetchedComments = Array.isArray(data.data) ? data.data : (data.data?.docs || data.data || []);
            setComments(fetchedComments);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoadingComments(false);
        }
    };

    const handleLike = async () => {
        if (!normalizedPost) return;
        const prevLiked = isLiked;
        setIsLiked(!isLiked);
        setLikesCount(prev => !prevLiked ? prev + 1 : prev - 1);
        try {
            await api.post(`/posts/${normalizedPost._id}/like`);
        } catch (error) {
            setIsLiked(prevLiked);
            setLikesCount(prev => prevLiked ? prev + 1 : prev - 1);
            toast.error("Failed to like");
        }
    };

    const handleSave = async () => {
        if (!normalizedPost) return;
        const prevSaved = isSaved;
        setIsSaved(!isSaved);
        try {
            await api.post(`/posts/${normalizedPost._id}/save`);
            toast.success(!prevSaved ? "Saved" : "Removed from saved");
        } catch (error) {
            setIsSaved(prevSaved);
            toast.error("Failed to save");
        }
    };

    const handleDeletePost = async () => {
        if (!normalizedPost) return;
        if (!confirm("Delete this content?")) return;
        try {
            await api.delete(`/posts/${normalizedPost._id}/delete`);
            toast.success("Deleted successfully");
            onClose();
            window.location.reload();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleEditPost = async (updatedData: { caption: string; location: string; tags: string }) => {
        if (!normalizedPost) return;
        try {
            await api.put(`/posts/${normalizedPost._id}`, {
                caption: updatedData.caption,
                location: updatedData.location,
            });
            setLocalPostData({
                ...normalizedPost,
                caption: updatedData.caption,
                location: updatedData.location
            });
            toast.success("Post updated successfully!");
        } catch (error) {
            toast.error("Failed to update post");
        }
    }

    const toggleVideoPlay = () => {
        if (videoRef.current && (videoRef.current.currentSrc || videoRef.current.src)) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                } else {
                    setIsPlaying(true);
                }
            }
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
        if (!newComment.trim() || !normalizedPost) return;
        try {
            const payload = { content: newComment, parentCommentId: replyingTo ? replyingTo._id : null };
            const { data } = await api.post(`/comments/post/${normalizedPost._id}`, payload);
            const createdComment = data.data || data;
            setComments([createdComment, ...comments]);
            setNewComment("");
            setReplyingTo(null);
        } catch (error) {
            toast.error("Failed to post comment");
        }
    };

    const toggleCommentLike = async (commentId: string) => {
        if (!currentUser) return;
        setComments(currentComments =>
            currentComments.map(c => {
                if (c._id === commentId) {
                    const hasLiked = c.likes.includes(currentUser._id);
                    return { ...c, likes: hasLiked ? c.likes.filter(id => id !== currentUser._id) : [...c.likes, currentUser._id] };
                }
                return c;
            })
        );
        try { await api.post(`/comments/${commentId}/like`); }
        catch (error) { if (normalizedPost) fetchComments(normalizedPost._id); }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/comments/${commentId}/delete`);
            setComments(comments.filter(c => c._id !== commentId));
            toast.success("Comment deleted");
        } catch (error) { toast.error("Failed to delete comment"); }
    };

    // ✅ FIXED: Restored formatTimeAgo and formatPostDate
    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            if (seconds < 60) return "Just now";
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h`;
            const days = Math.floor(hours / 24);
            if (days < 7) return `${days}d`;
            return date.toLocaleDateString();
        } catch (e) { return ""; }
    };

    const formatPostDate = (dateString: string) => {
        if (!dateString) return "";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric"
            }).toUpperCase();
        } catch (e) { return ""; }
    };

    if (!normalizedPost) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 pointer-events-none">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full md:w-full md:max-w-6xl md:h-[85vh] bg-background border border-border/50 md:rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row pointer-events-auto">

                                <div className="w-full md:w-[55%] lg:w-[60%] h-[45vh] md:h-full bg-black flex items-center justify-center relative shrink-0 overflow-hidden">
                                    {normalizedPost.isVideo ? (
                                        <div className="relative w-full h-full flex items-center justify-center bg-black group" onClick={toggleVideoPlay}>
                                            <video ref={videoRef} src={normalizedPost.videoUrl || undefined} className="w-full h-full object-contain" loop muted={muted} playsInline />
                                            {!isPlaying && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <Play className="w-16 h-16 text-white/80 fill-white/80" />
                                                </div>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10">
                                                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    ) : normalizedPost.imageUrl ? (
                                        <img src={normalizedPost.imageUrl} alt="Post" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                                            <AlertCircle className="w-10 h-10 opacity-50" />
                                            <span>Content Unavailable</span>
                                        </div>
                                    )}
                                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white md:hidden hover:bg-black/70 z-20">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 flex flex-col h-full bg-background min-h-0">
                                    <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-yellow-400 to-purple-600 p-0.5">
                                                <img src={normalizedPost.user.profilePic || "/default-avatar.png"} alt={normalizedPost.user.username} className="w-full h-full rounded-full object-cover bg-background border-2 border-background" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-sm hover:underline cursor-pointer block">
                                                    {normalizedPost.user.username}
                                                </span>
                                                {normalizedPost.location && (
                                                    <span className="text-xs text-muted-foreground">{normalizedPost.location}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => setIsOptionsOpen(true)}>
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex"><X className="w-5 h-5" /></Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-background">
                                        {normalizedPost.caption && (
                                            <div className="flex gap-3 mb-4">
                                                <div className="shrink-0 w-8 h-8 hidden md:block">
                                                    <img src={normalizedPost.user.profilePic || "/default-avatar.png"} className="w-8 h-8 rounded-full object-cover" />
                                                </div>
                                                <div className="flex-1 text-sm">
                                                    <span className="font-semibold mr-2 hidden md:inline">{normalizedPost.user.username}</span>
                                                    <span className="whitespace-pre-wrap">{normalizedPost.caption}</span>
                                                    <div className="text-xs text-muted-foreground mt-2">{formatTimeAgo(normalizedPost.createdAt)}</div>
                                                </div>
                                            </div>
                                        )}

                                        {isLoadingComments ? (
                                            <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                        ) : comments.length === 0 ? (
                                            <div className="text-center text-muted-foreground text-sm py-10">No comments yet.</div>
                                        ) : comments.map(comment => {
                                            const isCommentLiked = comment.likes?.includes(currentUser?._id || '');
                                            const cUser = comment.user || { username: "Unknown", profilePic: "" };
                                            const canDelete = currentUser?._id === cUser._id || currentUser?._id === normalizedPost.user._id;
                                            return (
                                                <div key={comment._id} className="flex gap-3 group">
                                                    <div className="shrink-0 w-8 h-8">
                                                        <img src={cUser.profilePic || "/default-avatar.png"} className="w-8 h-8 rounded-full object-cover border border-border" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div className="text-sm">
                                                                <span className="font-semibold mr-2">{cUser.username}</span>
                                                                <span className="text-foreground/90">{comment.text}</span>
                                                            </div>
                                                            <button onClick={() => toggleCommentLike(comment._id)} className="pt-1">
                                                                <Heart className={cn("w-3 h-3", isCommentLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-muted-foreground/80")} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                                                            <span>{formatTimeAgo(comment.createdAt)}</span>
                                                            {comment.likes?.length > 0 && <span>{comment.likes.length} likes</span>}
                                                            <button onClick={() => initiateReply(comment)} className="hover:text-foreground">Reply</button>
                                                            {canDelete && (
                                                                <button onClick={() => handleDeleteComment(comment._id)} className="md:opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="border-t border-border shrink-0 bg-background p-3 pb-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-4">
                                                <button onClick={handleLike} className="hover:opacity-70 transition-opacity">
                                                    <Heart className={cn("w-6 h-6", isLiked ? "fill-red-500 text-red-500" : "text-foreground")} />
                                                </button>
                                                <button className="hover:opacity-70 transition-opacity" onClick={() => inputRef.current?.focus()}>
                                                    <MessageCircle className="w-6 h-6 -rotate-90" />
                                                </button>

                                                <button onClick={() => setIsShareOpen(true)} className="hover:opacity-70 transition-opacity">
                                                    <Share2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                            <button onClick={handleSave} className="hover:opacity-70 transition-opacity">
                                                <Bookmark className={cn("w-6 h-6", isSaved ? "fill-foreground text-foreground" : "text-foreground")} />
                                            </button>
                                        </div>
                                        <button onClick={() => setIsLikesOpen(true)} className="font-bold text-sm mb-1 hover:text-muted-foreground transition-colors">
                                            {likesCount} likes
                                        </button>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                            {formatPostDate(normalizedPost.createdAt)}
                                        </div>
                                    </div>

                                    <div className="border-t border-border shrink-0 p-3 flex items-center gap-2">
                                        <button className="p-2 text-muted-foreground hover:text-foreground hidden sm:block"><Smile className="w-6 h-6" /></button>
                                        <form onSubmit={handleAddComment} className="flex-1 flex items-center">
                                            <Input
                                                ref={inputRef}
                                                placeholder="Add a comment..."
                                                className="border-none bg-transparent focus-visible:ring-0 px-0 shadow-none h-auto py-2 text-sm"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                            />
                                            {newComment.trim().length > 0 && (
                                                <button type="submit" className="text-blue-500 font-semibold text-sm hover:text-blue-400 transition-colors ml-2">Post</button>
                                            )}
                                        </form>
                                    </div>

                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {normalizedPost && (
                <FeedPostOptionsDialog
                    isOpen={isOptionsOpen}
                    onClose={() => setIsOptionsOpen(false)}
                    postId={normalizedPost._id}
                    isOwnPost={currentUser?._id === normalizedPost.user._id}
                    onDelete={handleDeletePost}
                    onEdit={() => setIsEditOpen(true)}
                />
            )}

            {normalizedPost && (
                <EditPostDialog
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    caption={normalizedPost.caption || ""}
                    onSave={handleEditPost}
                />
            )}

            <LikesCountDialog
                isOpen={isLikesOpen}
                onClose={() => setIsLikesOpen(false)}
                likesCount={likesCount}
                postId={normalizedPost._id}
            />

            {normalizedPost && (
                <ShareDialog
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    postId={normalizedPost._id}
                />
            )}
        </>
    );
}