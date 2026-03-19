import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Filter, Download, Eye, Ban, Trash2,
    Heart, MessageCircle,
    Loader2, Video, Image as ImageIcon
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { PostViewDialog } from "@/components/feed/PostViewDialog";

// ✅ 1. Define the Props Interface
interface PostsTabProps {
    searchQuery: string;
}

// ✅ 2. Accept the prop here
export function PostsTab({ searchQuery }: PostsTabProps) {
    const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // --- View Modal State ---
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    // 1. Fetch Content
    useEffect(() => {
        // Debounce search slightly to avoid too many API calls
        const timer = setTimeout(() => {
            fetchContent();
        }, 500);
        return () => clearTimeout(timer);
        // ✅ Add searchQuery to dependency array
    }, [activeTab, page, searchQuery]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            // ✅ Pass search query to backend
            const { data } = await api.get(
                `/admin/content?type=${activeTab}&page=${page}&search=${searchQuery || ''}&t=${Date.now()}`
            );
            setPosts(data.data.content);
            setTotalPages(data.data.pages);
        } catch (error) {
            toast.error("Failed to load content");
        } finally {
            setLoading(false);
        }
    };

    // 2. Hide/Unhide Content
    const handleToggleHide = async (id: string, currentStatus: boolean) => {
        setProcessingId(id);

        // Optimistic Update
        const newIsHidden = !currentStatus;

        setPosts(prev => prev.map(p =>
            p._id === id ? { ...p, isHidden: newIsHidden } : p
        ));

        try {
            const typeParam = activeTab === "reels" ? "reel" : "post";
            const { data } = await api.patch(`/admin/content/${id}/hide?type=${typeParam}`);

            // Sync with server response
            const updatedItem = data.data;
            setPosts(prev => prev.map(p =>
                p._id === id ? { ...p, isHidden: updatedItem.isHidden } : p
            ));

            toast.success(newIsHidden ? "Content hidden" : "Content visible");
        } catch (error) {
            // Revert
            setPosts(prev => prev.map(p =>
                p._id === id ? { ...p, isHidden: currentStatus } : p
            ));
            toast.error("Failed to update visibility");
        } finally {
            setProcessingId(null);
        }
    };

    // 3. Delete Content
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure? This cannot be undone.")) return;

        setProcessingId(id);
        try {
            const typeParam = activeTab === "reels" ? "reel" : "post";
            await api.delete(`/admin/content/${id}?type=${typeParam}`);

            setPosts(prev => prev.filter(p => p._id !== id));
            toast.success("Deleted successfully");
        } catch (error) {
            toast.error("Failed to delete");
        } finally {
            setProcessingId(null);
        }
    };

    const openViewModal = (post: any) => {
        const postWithType = {
            ...post,
            type: activeTab === "reels" ? "reel" : "post"
        };
        setSelectedPost(postWithType);
        setIsViewOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="glass-strong rounded-2xl overflow-hidden">

                    {/* Header */}
                    <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-lg">Manage Content</h3>
                            <div className="flex bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => { setActiveTab("posts"); setPage(1); }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "posts" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted"}`}
                                >
                                    <ImageIcon className="w-4 h-4" /> Posts
                                </button>
                                <button
                                    onClick={() => { setActiveTab("reels"); setPage(1); }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "reels" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted"}`}
                                >
                                    <Video className="w-4 h-4" /> Reels
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 glass rounded-lg text-sm flex items-center gap-2 hover:text-white transition-colors">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                            <button className="px-3 py-1.5 glass rounded-lg text-sm flex items-center gap-2 hover:text-white transition-colors">
                                <Download className="w-4 h-4" /> Export
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto min-h-100">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="text-left p-4 font-medium pl-6">Content</th>
                                    <th className="text-left p-4 font-medium hidden md:table-cell">Author</th>
                                    <th className="text-left p-4 font-medium hidden sm:table-cell">Stats</th>
                                    <th className="text-left p-4 font-medium">Status</th>
                                    <th className="text-left p-4 font-medium pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No content found matching "{searchQuery}".</td></tr>
                                ) : (
                                    posts.map((post, index) => {
                                        const isHidden = post.isHidden === true;

                                        return (
                                            <motion.tr
                                                key={post._id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                                            >
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 relative border border-white/10 group-hover:border-primary/50 transition-colors">
                                                            {post.image ? (
                                                                <img src={post.image} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                    {activeTab === "reels" ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 max-w-50">
                                                            <p className="font-medium truncate text-foreground">{post.caption || "No Caption"}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(post.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-4 hidden md:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <AvatarRing src={post.user?.profilePic} size="sm" />
                                                        <div>
                                                            <p className="font-medium text-sm text-foreground">{post.user?.name}</p>
                                                            <p className="text-xs text-muted-foreground">@{post.user?.username}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-4 hidden sm:table-cell">
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes}</span>
                                                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments}</span>
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${isHidden
                                                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                        : "bg-green-500/10 text-green-400 border-green-500/20"
                                                        }`}>
                                                        {isHidden ? "Hidden" : "Published"}
                                                    </span>
                                                </td>

                                                <td className="p-4 pr-6">
                                                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            onClick={() => openViewModal(post)}
                                                            className="p-2 glass rounded-lg hover:text-white"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </motion.button>

                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            onClick={() => handleToggleHide(post._id, isHidden)}
                                                            disabled={processingId === post._id}
                                                            className={`p-2 glass rounded-lg ${isHidden ? "text-green-400 hover:bg-green-500/20" : "text-yellow-500 hover:bg-yellow-500/20"}`}
                                                            title={isHidden ? "Unhide" : "Hide"}
                                                        >
                                                            {processingId === post._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                isHidden ? <Eye className="w-4 h-4" /> : <Ban className="w-4 h-4" />
                                                            )}
                                                        </motion.button>

                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            onClick={() => handleDelete(post._id)}
                                                            disabled={processingId === post._id}
                                                            className="p-2 glass rounded-lg hover:bg-red-500/20 hover:text-red-500"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-border/50 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 glass rounded-lg text-sm disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-gradient-primary text-white rounded-lg text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <PostViewDialog
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                post={selectedPost}
            />
        </>
    );
}