import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, BadgeCheck, X, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

// --- Interfaces ---
interface CommentUser {
    _id: string;
    username: string;
    profilePic: string;
    isVerified?: boolean;
}

export interface Comment {
    _id: string;
    user: CommentUser;
    text: string;
    createdAt: string;
    likes: string[];
    parentComment: string | null;
    replies?: Comment[];
}

interface ReelCommentsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    commentCount: string;
    onCommentAdded: () => void; // ✅ Callback for parent updates
    isEmbedded?: boolean; // ✅ Flag for desktop modal embedding
}

export function ReelCommentsSheet({
    isOpen,
    onClose,
    postId,
    commentCount,
    onCommentAdded,
    isEmbedded = false
}: ReelCommentsSheetProps) {
    const { user: currentUser } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

    // 1. Fetch Comments
    const fetchComments = async () => {
        try {
            setLoading(true);
            // Calls GET /api/v1/posts/:postId/comments
            const { data } = await api.get(`/posts/${postId}/comments`);

            // Normalize response data structure
            let commentsData: Comment[] = [];
            if (Array.isArray(data.data)) {
                commentsData = data.data;
            } else if (data.data?.docs) {
                commentsData = data.data.docs;
            } else {
                commentsData = data.data || [];
            }

            const nestedComments = buildCommentTree(commentsData);
            setComments(nestedComments);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoading(false);
        }
    };

    const buildCommentTree = (flatComments: Comment[]) => {
        const commentMap: Record<string, Comment> = {};
        const roots: Comment[] = [];

        // Initialize map
        flatComments.forEach(c => {
            commentMap[c._id] = { ...c, replies: [] };
        });

        // Build hierarchy
        flatComments.forEach(c => {
            if (c.parentComment) {
                if (commentMap[c.parentComment]) {
                    commentMap[c.parentComment].replies?.push(commentMap[c._id]);
                }
            } else {
                roots.push(commentMap[c._id]);
            }
        });

        // Sort by Date (Newest first)
        return roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    // 2. Add Comment
    const handleSend = async () => {
        if (!newComment.trim()) return;
        try {
            setSending(true);
            const payload = { content: newComment, parentCommentId: replyingTo?.id || null };

            const { data } = await api.post(`/posts/${postId}/comments`, payload);
            const createdComment = data.data || data;

            // Optimistically update UI
            if (replyingTo) {
                setComments(prev =>
                    prev.map(c => {
                        if (c._id === replyingTo.id) {
                            return { ...c, replies: [createdComment, ...(c.replies || [])] };
                        }
                        return c;
                    })
                );
                setExpandedReplies(prev => ({ ...prev, [replyingTo.id]: true }));
            } else {
                setComments(prev => [createdComment, ...prev]);
            }

            setNewComment("");
            setReplyingTo(null);

            // Notify parent to update count
            onCommentAdded();

        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setSending(false);
        }
    };

    // 3. Interactions
    const toggleLike = async (commentId: string) => {
        try {
            setComments(prev => updateCommentInTree(prev, commentId, (c) => {
                const isLiked = c.likes.includes(currentUser?._id || "");
                const newLikes = isLiked ? c.likes.filter(id => id !== currentUser?._id) : [...c.likes, currentUser?._id || ""];
                return { ...c, likes: newLikes };
            }));
            await api.post(`/posts/comments/${commentId}/like`);
        } catch (error) { console.error(error); fetchComments(); }
    };

    const handleDelete = async (commentId: string) => {
        try {
            setComments(prev => removeCommentFromTree(prev, commentId));
            await api.delete(`/posts/comments/${commentId}/delete`);
        } catch (error) { console.error(error); fetchComments(); }
    };

    // Helpers
    const updateCommentInTree = (list: Comment[], id: string, updater: (c: Comment) => Comment): Comment[] => {
        return list.map(c => {
            if (c._id === id) return updater(c);
            if (c.replies && c.replies.length > 0) return { ...c, replies: updateCommentInTree(c.replies, id, updater) };
            return c;
        });
    };

    const removeCommentFromTree = (list: Comment[], id: string): Comment[] => {
        return list.filter(c => c._id !== id).map(c => ({
            ...c,
            replies: c.replies ? removeCommentFromTree(c.replies, id) : []
        }));
    };

    const toggleRepliesVisibility = (id: string) => {
        setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const initiateReply = (comment: Comment) => {
        setReplyingTo({ id: comment._id, username: comment.user.username });
    };

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
        }
    }, [isOpen, postId]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - Only show if NOT embedded */}
                    {!isEmbedded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
                        />
                    )}

                    <motion.div
                        initial={isEmbedded ? { opacity: 0 } : { y: "100%" }}
                        animate={isEmbedded ? { opacity: 1 } : { y: 0 }}
                        exit={isEmbedded ? { opacity: 0 } : { y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={cn(
                            // ✅ Conditional Styling: Full fill if embedded, bottom sheet if not
                            isEmbedded
                                ? "absolute inset-0 z-0 bg-background flex flex-col"
                                : "absolute bottom-0 left-0 right-0 z-50 bg-neutral-900 rounded-t-xl overflow-hidden flex flex-col h-[70%]"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header (Hide Close Button if Embedded) */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neutral-900 shrink-0">
                            <div className="flex flex-col">
                                <span className="text-white font-semibold text-sm">Comments</span>
                                {/* Total Count Logic */}
                                <span className="text-white/50 text-xs">
                                    {comments.length > 0 ? comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0) : commentCount} comments
                                </span>
                            </div>
                            {!isEmbedded && (
                                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center text-white/40 py-10 text-sm">No comments yet.</div>
                            ) : (
                                comments.map((comment) => (
                                    <CommentItem
                                        key={comment._id}
                                        comment={comment}
                                        currentUser={currentUser}
                                        onLike={toggleLike}
                                        onReply={initiateReply}
                                        onDelete={handleDelete}
                                        expandedReplies={expandedReplies}
                                        toggleReplies={toggleRepliesVisibility}
                                    />
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-white/10 bg-black/90 shrink-0">
                            {replyingTo && (
                                <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-white/10 rounded-md">
                                    <span className="text-white/70 text-xs">Replying to <span className="font-bold">@{replyingTo.username}</span></span>
                                    <button onClick={() => setReplyingTo(null)}>
                                        <X className="w-3 h-3 text-white/70" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <img
                                    src={currentUser?.profilePic || "https://github.com/shadcn.png"}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                                />
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Add a comment..."}
                                        className="w-full bg-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
                                        disabled={sending}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!newComment.trim() || sending}
                                        className={cn(
                                            "absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors",
                                            newComment.trim() ? "text-blue-400 hover:bg-white/10" : "text-white/20"
                                        )}
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function CommentItem({ comment, currentUser, onLike, onReply, onDelete, expandedReplies, toggleReplies }: any) {
    const isLiked = comment.likes.includes(currentUser?._id);
    const isOwner = comment.user._id === currentUser?._id;

    return (
        <div className="space-y-3">
            <div className="flex gap-3 group">
                <img
                    src={comment.user.profilePic || "https://github.com/shadcn.png"}
                    alt={comment.user.username}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-white text-xs font-semibold">{comment.user.username}</span>
                        {comment.user.isVerified && (
                            <BadgeCheck className="w-3 h-3 text-blue-400 fill-blue-400" />
                        )}
                        <span className="text-white/40 text-[10px]">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>

                    <p className="text-white text-xs leading-relaxed wrap-break-word">{comment.text}</p>

                    <div className="flex items-center gap-4 mt-1.5">
                        <button onClick={() => onReply(comment)} className="text-white/50 text-[10px] font-semibold hover:text-white transition-colors">
                            Reply
                        </button>
                        {comment.likes.length > 0 && (
                            <span className="text-white/40 text-[10px]">{comment.likes.length} likes</span>
                        )}
                        {isOwner && (
                            <button onClick={() => onDelete(comment._id)} className="text-white/30 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                        <button
                            onClick={() => toggleReplies(comment._id)}
                            className="flex items-center gap-2 mt-2 text-white/50 text-[10px] hover:text-white transition-colors group/replies"
                        >
                            <div className="w-6 h-px bg-white/20 group-hover/replies:bg-white/40 transition-colors" />
                            {expandedReplies[comment._id]
                                ? "Hide replies"
                                : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                        </button>
                    )}
                </div>

                <button onClick={() => onLike(comment._id)} className="shrink-0 p-1 self-start active:scale-90 transition-transform">
                    <Heart className={cn("w-3.5 h-3.5 transition-colors", isLiked ? "text-red-500 fill-red-500" : "text-white/30 hover:text-white/60")} />
                </button>
            </div>

            <AnimatePresence>
                {expandedReplies[comment._id] && comment.replies && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-11 space-y-3"
                    >
                        {comment.replies.map((reply: any) => (
                            <CommentItem
                                key={reply._id}
                                comment={reply}
                                currentUser={currentUser}
                                onLike={onLike}
                                onReply={onReply}
                                onDelete={onDelete}
                                expandedReplies={expandedReplies}
                                toggleReplies={toggleReplies}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}