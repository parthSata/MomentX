import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, X, Loader2 } from "lucide-react"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"
import { useNavigate } from "react-router-dom" // ✅ Import useNavigate

interface LikesCountDialogProps {
    isOpen: boolean
    onClose: () => void
    postId: string
    likesCount: number
}

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
}

export function LikesCountDialog({ isOpen, onClose, postId, likesCount }: LikesCountDialogProps) {
    const [likedUsers, setLikedUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate() // ✅ Initialize navigate

    useEffect(() => {
        if (isOpen && postId) {
            setLoading(true)
            api.get(`/posts/${postId}/likes`)
                .then(res => setLikedUsers(res.data.data || []))
                .catch(err => console.error("Failed to fetch likes:", err))
                .finally(() => setLoading(false))
        } else {
            setLikedUsers([])
        }
    }, [isOpen, postId])

    // ✅ Helper function to handle navigation
    const handleNavigate = (username: string) => {
        onClose(); // Close the dialog
        navigate(`/u/${username}`); // Navigate to the profile
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm glass-strong bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                <h2 className="text-lg font-semibold font-display">Likes</h2>
                                <span className="text-sm text-muted-foreground">({formatNumber(likesCount)})</span>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 min-h-37.5">
                            {loading ? (
                                <div className="flex items-center justify-center h-full py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : likedUsers.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No likes yet.</p>
                            ) : (
                                likedUsers.map((user) => (
                                    <div key={user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                                        {/* ✅ Make the left side clickable too */}
                                        <div
                                            className="flex items-center gap-3 cursor-pointer"
                                            onClick={() => handleNavigate(user.username)}
                                        >
                                            <AvatarRing src={user.profilePic || "/default-avatar.png"} alt={user.name} size="sm" />
                                            <div>
                                                <p className="text-sm font-semibold">{user.username}</p>
                                                <p className="text-xs text-muted-foreground">{user.name}</p>
                                            </div>
                                        </div>
                                        {/* ✅ Navigate on button click */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-8"
                                            onClick={() => handleNavigate(user.username)}
                                        >
                                            View
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}