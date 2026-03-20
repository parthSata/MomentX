import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Loader2, User } from "lucide-react";
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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-md"
                    />

                    {/* Dialog Container */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-lg bg-background/95 glass-strong border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-[111] max-h-[85vh]"
                    >
                        {/* Drag Handle for Mobile */}
                        <div className="flex justify-center py-4 shrink-0 sm:hidden">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-card/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-2xl">
                                    <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-xl font-black tracking-tighter uppercase italic">
                                        Endorsement <span className="gradient-text">Log</span>
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        {formatNumber(likesCount)} Global Resonances
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group"
                            >
                                <X className="w-6 h-6 text-muted-foreground group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-10 s-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Accessing Node Database...</p>
                                </div>
                            ) : likedUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                                    <Heart className="w-16 h-16 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No Resonances Detected</p>
                                </div>
                            ) : (
                                likedUsers.map((user, i) => (
                                    <motion.div 
                                        key={user._id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex items-center justify-between p-4 rounded-3xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                                    >
                                        <div
                                            className="flex items-center gap-4 cursor-pointer flex-1"
                                            onClick={() => handleNavigate(user.username)}
                                        >
                                            <AvatarRing src={user.profilePic || "/image.png"} alt={user.name} size="md" />
                                            <div>
                                                <p className="font-bold text-sm group-hover:text-primary transition-colors">{user.username}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{user.name}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="glass"
                                            size="sm"
                                            className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-white/5 group-hover:border-primary/30 group-hover:text-primary transition-all"
                                            onClick={() => handleNavigate(user.username)}
                                        >
                                            Inspect Profile
                                        </Button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Safe area padding for bottom of mobile screens */}
                        <div className="h-6 shrink-0 sm:hidden" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}