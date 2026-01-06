import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Bookmark, MoreHorizontal, Share2, Trash2, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import type { Post } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

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

    // Data
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    // Interaction (Optimistic)
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isSaved, setIsSaved] = useState(false);

    // UI
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize
    useEffect(() => {
        if (post && isOpen) {
            const likesData = post.likes as any;
            const count = typeof likesData === 'number'
                ? likesData
                : (Array.isArray(likesData) ? likesData.length : 0);

            setIsLiked(post.isLiked || false);
            setIsSaved(post.isSaved || false);
            setLikesCount(count);
            setReplyingTo(null);
            setNewComment("");

            fetchComments(post._id);
        }
    }, [post, isOpen]);

    const fetchComments = async (postId: string) => {
        setIsLoadingComments(true);
        try {
            const { data } = await api.get(`/posts/${postId}/comments`);
            const fetchedComments = Array.isArray(data.data) ? data.data : (data.data?.docs || []);
            setComments(fetchedComments);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoadingComments(false);
        }
    };

    // --- HANDLERS ---

    const handleLike = async () => {
        if (!post) return;
        const prevLiked = isLiked;
        setIsLiked(!isLiked);
        setLikesCount(prev => !prevLiked ? prev + 1 : prev - 1);

        try {
            await api.post(`/posts/${post._id}/like`);
        } catch (error) {
            setIsLiked(prevLiked);
            setLikesCount(prev => prevLiked ? prev + 1 : prev - 1);
            toast.error("Failed to like post");
        }
    };

    const handleSave = async () => {
        if (!post) return;
        const prevSaved = isSaved;
        setIsSaved(!isSaved);

        try {
            await api.post(`/posts/${post._id}/save`);
            toast.success(!prevSaved ? "Post saved" : "Removed from saved");
        } catch (error) {
            setIsSaved(prevSaved);
            toast.error("Failed to save post");
        }
    };

    const handleDeletePost = async () => {
        if (!post) return;
        if (!confirm("Delete this post?")) return;
        try {
            await api.delete(`/posts/${post._id}/delete`);
            toast.success("Post deleted");
            onClose();
            window.location.reload();
        } catch (error) {
            toast.error("Failed to delete post");
        }
    };

    // --- COMMENT LOGIC ---

    const initiateReply = (comment: Comment) => {
        setReplyingTo(comment);
        setNewComment(`@${comment.user.username} `);
        inputRef.current?.focus();
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !post) return;

        try {
            const payload = {
                content: newComment,
                parentCommentId: replyingTo ? replyingTo._id : null
            };
            const { data } = await api.post(`/posts/${post._id}/comments`, payload);
            setComments([data.data, ...comments]);
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
                    return {
                        ...c,
                        likes: hasLiked ? c.likes.filter(id => id !== currentUser._id) : [...c.likes, currentUser._id]
                    };
                }
                return c;
            })
        );
        try { await api.post(`/posts/comments/${commentId}/like`); }
        catch (error) { fetchComments(post!._id); }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/posts/comments/${commentId}/delete`);
            setComments(comments.filter(c => c._id !== commentId));
            toast.success("Comment deleted");
        } catch (error) { toast.error("Failed to delete comment"); }
    };

    // --- HELPERS ---

    const formatTimeAgo = (dateString: string) => {
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
        return date.toLocaleDateString(); // Fallback
    };

    const formatPostDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        }).toUpperCase();
    };

    if (!post) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0  backdrop-blur-sm z-50"
                    />

                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-6xl h-[85vh] bg-background border border-border/50 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row pointer-events-auto"
                        >
                            {/* --- LEFT: MEDIA --- */}
                            <div className="hidden md:flex md:w-[55%] lg:w-[60%] bg-black items-center justify-center relative">
                                {post.images?.[0] ? (
                                    <img
                                        src={post.images[0]}
                                        alt="Post"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <div className="text-muted-foreground">No Media</div>
                                )}
                            </div>

                            {/* --- RIGHT: INTERACTION --- */}
                            <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col h-full bg-background">

                                {/* 1. Header */}
                                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-yellow-400 to-purple-600 p-0.5">
                                            <div className="w-full h-full rounded-full bg-background p-px">
                                                <img
                                                    src={post.user?.profilePic || "/default-avatar.png"}
                                                    alt={post.user?.username}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <span className="font-semibold text-sm hover:underline cursor-pointer">
                                            {post.user?.username}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                            {showSettings && currentUser?._id === post.user?._id && (
                                                <div className="absolute right-0 mt-2 w-32 bg-popover border border-border rounded shadow-lg z-10">
                                                    <button onClick={handleDeletePost} className="w-full px-4 py-2 text-sm text-red-500 hover:bg-muted text-left flex items-center gap-2">
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={onClose}>
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* 2. Comments Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">

                                    {/* Caption as First "Comment" */}
                                    {post.caption && (
                                        <div className="flex gap-3 mb-4">
                                            <div className="shrink-0 w-8 h-8">
                                                <img
                                                    src={post.user?.profilePic || "/default-avatar.png"}
                                                    className="w-8 h-8 rounded-full object-cover border border-border"
                                                />
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <span className="font-semibold mr-2">{post.user?.username}</span>
                                                <span className="whitespace-pre-wrap">{post.caption}</span>
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    {formatTimeAgo(post.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Comments List */}
                                    {isLoadingComments ? (
                                        <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : comments.map(comment => {
                                        const isCommentLiked = comment.likes?.includes(currentUser?._id || '');
                                        return (
                                            <div key={comment._id} className="flex gap-3 group">
                                                <div className="shrink-0 w-8 h-8">
                                                    <img
                                                        src={comment.user?.profilePic || "/default-avatar.png"}
                                                        className="w-8 h-8 rounded-full object-cover border border-border"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div className="text-sm">
                                                            <span className="font-semibold mr-2">{comment.user?.username}</span>
                                                            <span className="text-foreground/90">{comment.text}</span>
                                                        </div>
                                                        <button onClick={() => toggleCommentLike(comment._id)} className="pt-1">
                                                            <Heart className={cn("w-3 h-3", isCommentLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-muted-foreground/80")} />
                                                        </button>
                                                    </div>

                                                    {/* Meta Row */}
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                                                        <span>{formatTimeAgo(comment.createdAt)}</span>
                                                        {comment.likes?.length > 0 && (
                                                            <span>{comment.likes.length} likes</span>
                                                        )}
                                                        <button onClick={() => initiateReply(comment)} className="hover:text-foreground">
                                                            Reply
                                                        </button>
                                                        {currentUser?._id === comment.user._id && (
                                                            <button onClick={() => handleDeleteComment(comment._id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 3. Footer Actions */}
                                <div className="border-t border-border shrink-0 bg-background p-4 pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-4">
                                            <button onClick={handleLike} className="hover:opacity-70 transition-opacity">
                                                <Heart className={cn("w-6 h-6", isLiked ? "fill-red-500 text-red-500" : "text-foreground")} />
                                            </button>
                                            <button className="hover:opacity-70 transition-opacity">
                                                <MessageCircle className="w-6 h-6 -rotate-90" />
                                            </button>
                                            <button className="hover:opacity-70 transition-opacity">
                                                <Share2 className="w-6 h-6" />
                                            </button>
                                        </div>
                                        <button onClick={handleSave} className="hover:opacity-70 transition-opacity">
                                            <Bookmark className={cn("w-6 h-6", isSaved ? "fill-foreground text-foreground" : "text-foreground")} />
                                        </button>
                                    </div>

                                    <div className="font-bold text-sm mb-1">{likesCount} likes</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-4">
                                        {formatPostDate(post.createdAt)}
                                    </div>
                                </div>

                                {/* 4. Input Area */}
                                <div className="border-t border-border shrink-0 p-3 flex items-center gap-2">
                                    <button className="p-2 text-muted-foreground hover:text-foreground">
                                        <Smile className="w-6 h-6" />
                                    </button>
                                    <form onSubmit={handleAddComment} className="flex-1 flex items-center">
                                        <Input
                                            ref={inputRef}
                                            placeholder="Add a comment..."
                                            className="border-none bg-transparent focus-visible:ring-0 px-0 shadow-none h-auto py-2 text-sm"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        {newComment.trim().length > 0 && (
                                            <button type="submit" className="text-blue-500 font-semibold text-sm hover:text-blue-400 transition-colors ml-2">
                                                Post
                                            </button>
                                        )}
                                    </form>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}