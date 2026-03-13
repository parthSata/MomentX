import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Loader2 } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import { useNavigate } from "react-router-dom";

interface LikesCountDialogProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    likesCount: number;
}

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
}

export function LikesCountDialog({ isOpen, onClose, postId, likesCount }: LikesCountDialogProps) {
    const [likedUsers, setLikedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && postId) {
            setLoading(true);
            api.get(`/posts/${postId}/likes`)
                .then(res => setLikedUsers(res.data.data || []))
                .catch(err => console.error("Failed to fetch likes:", err))
                .finally(() => setLoading(false));
        } else {
            setLikedUsers([]);
        }
    }, [isOpen, postId]);

    const handleNavigate = (username: string) => {
        onClose();
        navigate(`/u/${username}`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-70"
                    />

                    {/* Bottom Sheet Modal */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-70 bg-zinc-900 rounded-t-3xl max-h-[85vh] flex flex-col md:max-w-md md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-3xl border border-white/10 shadow-2xl"
                    >
                        {/* Drag Handle for Mobile */}
                        <div className="flex justify-center py-3 shrink-0 md:hidden">
                            <div className="w-10 h-1 bg-white/30 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                <h2 className="text-white font-semibold text-lg font-display">Likes</h2>
                                <span className="text-sm text-white/50">({formatNumber(likesCount)})</span>
                            </div>
                            <button onClick={onClose} className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="overflow-y-auto flex-1 p-2 min-h-75 scrollbar-hide">
                            {loading ? (
                                <div className="flex items-center justify-center h-full py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                                </div>
                            ) : likedUsers.length === 0 ? (
                                <p className="text-center text-sm text-white/50 py-10">No likes yet.</p>
                            ) : (
                                <div className="space-y-1">
                                    {likedUsers.map((user) => (
                                        <div key={user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer flex-1"
                                                onClick={() => handleNavigate(user.username)}
                                            >
                                                <AvatarRing src={user.profilePic || "/image.png"} alt={user.name} size="sm" />
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{user.username}</p>
                                                    <p className="text-xs text-white/50">{user.name}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-8 bg-transparent border-white/20 text-white hover:bg-white/10"
                                                onClick={() => handleNavigate(user.username)}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Safe area padding for bottom of mobile screens */}
                        <div className="h-4 shrink-0" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}